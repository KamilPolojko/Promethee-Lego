from fastapi.middleware.cors import CORSMiddleware
from Database.config import engine
from fastapi import APIRouter
from Database.config import SessionLocal
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from Database.schemas import Criteria, Sets, CriteriaRequest, Ranking
from pydantic import validator
from fastapi import FastAPI, Request
import numpy as np
from pyrepo_mcda.mcda_methods import PROMETHEE_II
from sqlalchemy.sql import text
from gaia_functions import calculate_gaia_pca,format_gaia_results,calculate_decision_axis

app = FastAPI()
router = APIRouter()

def get_db():
    db=SessionLocal()

    try:
        yield db
    finally:
        db.close()


origins = [
    "http://localhost:3000",
    "http://192.168.0.78:3000",
    "http://localhost:8000",
    "http://192.168.0.78:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@router.get("/fetch-sets")
def fetch_sets(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
        SELECT s.set_num, s.name, s.year, s.price, t.name AS theme_name, s.num_parts, s.img_url, 
        COALESCE(SUM(im.quantity), 0) AS num_minifigs FROM sets s 
        JOIN themes t ON s.theme_id = t.id JOIN inventories i ON s.set_num = i.set_num 
        LEFT JOIN inventory_minifigs im ON i.id = im.inventory_id 
        WHERE  s.year > 2022 AND s.price IS NOT NULL AND s.year < 2025 
        GROUP BY s.set_num, t.name, s.name, s.year, s.price, s.num_parts, s.img_url;""")).fetchall()

        sets = [dict(row._mapping) for row in result]

        return {"count": len(sets),"sets": sets}
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch sets")


@router.get("/fetch-set/{id}")
def fetch_set(id: str, db: Session = Depends(get_db)):
        query = text("""
SELECT 
    json_build_object(
        'set_details', (
            SELECT json_build_object(
                'set_num', s.set_num,
                'set_name', s.name,
                'year', s.year,
                'total_parts', s.num_parts,
                'set_image', s.img_url,
                'theme_name', t.name,
                'price', s.price
            )
            FROM sets s
            JOIN themes t ON s.theme_id = t.id
            WHERE s.set_num = :set_num
        ),
        'parts', (
            SELECT json_agg(
                json_build_object(
                    'part_num', p.part_num,
                    'part_name', p.name,
                    'part_material', p.part_material,
                    'category_name', pc.name,
                    'color_name', c.name,
                    'color_rgb', c.rgb,
                    'quantity', ip.quantity,
                    'is_spare', ip.is_spare,
                    'part_image', ip.img_url
                )
                ORDER BY ip.quantity DESC, p.name
            )
            FROM inventories i
            JOIN inventory_parts ip ON ip.inventory_id = i.id
            JOIN parts p ON ip.part_num = p.part_num
            JOIN colors c ON ip.color_id = c.id
            JOIN part_categories pc ON p.part_cat_id = pc.id
            WHERE i.set_num = :set_num
              AND i.id = (
                  SELECT id
                  FROM inventories
                  WHERE set_num = :set_num
                  ORDER BY version DESC
                  LIMIT 1
              )
        )
    ) AS result;

        """)

        set_details = db.execute(query, {"set_num": id})
        set_details_return = [dict(row._mapping) for row in set_details]

        return set_details_return



@validator( "Q", "P", pre=True, always=True)
@router.get("/get-output")
async def get_output(request: Request, db: Session = Depends(get_db)):
    try:
        params = dict(request.query_params)
        # print(f"Received params: {params}")  # Debug
        print("DOSZŁO")
        criteria_list = []
        current_criteria = {}

        sets_list = []
        current_set = {}

        list_of_Q = []
        list_of_P = []
        list_of_F = []
        list_of_W = []
        list_of_T = []

        list_of_criterias = []

        for key, value in params.items():
            if key.startswith('criterias'):
                parts = key.split('[')
                field_name = parts[2].rstrip(']')

                if field_name in ['weight', 'Q', 'P', 'S']:
                    if value == "":
                        value = None
                    else:
                        value = float(value)

                current_criteria[field_name] = value
                match field_name:
                    case "Q":
                        list_of_Q.append(value)
                    case "P":
                        list_of_P.append(value)
                    case "promethee2Method":
                        list_of_F.append(value)
                    case "weight":
                        list_of_W.append(value)
                    case "type":
                        list_of_T.append(value)
                    case "name":
                        list_of_criterias.append(value)

                if field_name == 'promethee2Method':
                    criteria_list.append(Criteria(**current_criteria))
                    current_criteria = {}

            if key.startswith('sets'):
                parts2 = key.split('[')
                field_name2 = parts2[2].rstrip(']')

                if field_name2 in ['price', 'num_parts', 'num_minifigs']:
                    if value == "":
                        value = None
                    else:
                        value = float(value)

                if field_name2 in ['year']:
                    if value == "":
                        value = None
                    else:
                        value = int(value)


                current_set[field_name2] = value

                if field_name2 == 'num_minifigs':
                    sets_list.append(Sets(**current_set))
                    current_set = {}


        query = text("""
SELECT
    p.part_num,
    p.name AS part_name,
    p.part_material,
    pc.name AS category_name,
    c.name AS color_name,
    c.rgb AS color_rgb,
    c.is_trans AS is_transparent,
    ip.quantity,
    ip.is_spare,
    s.set_num,
    p.num_sets,
    dp.distinct_parts_count AS unique_parts_count,
    COALESCE(sp.spare_parts_count, 0) AS spare_parts_count 
FROM inventory_parts ip
JOIN parts p ON ip.part_num = p.part_num
JOIN colors c ON ip.color_id = c.id
JOIN part_categories pc ON p.part_cat_id = pc.id
JOIN inventories i ON ip.inventory_id = i.id
JOIN sets s ON i.set_num = s.set_num
JOIN (
    SELECT
        s.set_num,
        COUNT(DISTINCT CONCAT(ip.part_num, '-', ip.color_id)) AS distinct_parts_count
    FROM inventory_parts ip
    JOIN inventories i ON ip.inventory_id = i.id
    JOIN sets s ON i.set_num = s.set_num
    GROUP BY s.set_num
) dp ON dp.set_num = s.set_num
LEFT JOIN (
    SELECT
        ip.part_num,
        ip.color_id,
        i.set_num,
        SUM(CASE WHEN ip.is_spare = TRUE THEN ip.quantity ELSE 0 END) AS spare_parts_count
    FROM inventory_parts ip
    JOIN inventories i ON ip.inventory_id = i.id
    GROUP BY ip.part_num, ip.color_id, i.set_num
) sp ON sp.part_num = ip.part_num AND sp.color_id = ip.color_id AND sp.set_num = s.set_num
WHERE s.set_num = :set_num
ORDER BY ip.inventory_id, p.part_num;
        """)


        list_of_parts_of_each_set =[]

        for set in sets_list:
            set1 = db.execute(query, {"set_num": set.set_num})
            parts_of_set = [dict(row._mapping) for row in set1]
            list_of_parts_of_each_set.append(parts_of_set)

        matrix = []

        for i in range(len(sets_list)):
            matrix.append([])

        for criteria in list_of_criterias:
            criteria = int(criteria)
            match criteria:
                case 1:
                    iter = 0
                    for parts_of_set in list_of_parts_of_each_set:
                        sum = 0
                        for part_of_set in parts_of_set:
                            if 10 < part_of_set["num_sets"] < 100:
                                sum = sum + (part_of_set["num_sets"] * 0.1)
                            elif 100 < part_of_set["num_sets"]:
                                sum = sum + (part_of_set["num_sets"] * 0.01)
                            else:
                                sum = sum + part_of_set["num_sets"]

                        matrix[iter].append(sum)
                        iter += 1
                case 2:
                    for indeks, set in enumerate(sets_list):
                        matrix[indeks].append(set.year)
                case 3:
                    for indeks, set in enumerate(sets_list):
                        matrix[indeks].append(set.num_parts)
                case 4:
                    iter = 0
                    for parts_of_set in list_of_parts_of_each_set:
                        sum = 0
                        for part_of_set in parts_of_set:
                            if part_of_set["num_sets"]>50:
                                sum +=1
                        matrix[iter].append(sum)
                        iter += 1
                case 5:
                    iter = 0
                    for parts_of_set in list_of_parts_of_each_set:
                        sum = 0
                        for part_of_set in parts_of_set:
                            if part_of_set["num_sets"] == 1:
                                sum += 1
                        matrix[iter].append(sum)
                        iter += 1
                case 6:
                    iter = 0
                    for parts_of_set in list_of_parts_of_each_set:
                        matrix[iter].append(parts_of_set[0]["unique_parts_count"])
                        iter += 1
                case 7:
                    iter = 0
                    for parts_of_set in list_of_parts_of_each_set:
                        sum = 0
                        for part_of_set in parts_of_set:
                            sum += part_of_set["spare_parts_count"]
                        matrix[iter].append(sum)
                        iter += 1
                case 8:
                    for indeks, set in enumerate(sets_list):
                        matrix[indeks].append(set.price)
                case 9:
                    for indeks, set in enumerate(sets_list):
                        matrix[indeks].append(set.price/set.num_parts)
                case 10:
                    for indeks, set in enumerate(sets_list):
                        matrix[indeks].append(set.num_minifigs)


        matrix = np.array(matrix)
        Q = np.array(list_of_Q)
        P = np.array(list_of_P)
        weights = np.array([x / 100 for x in list_of_W])
        types = np.array([int(x) for x in list_of_T])

        promethee = PROMETHEE_II()

        preference_functions = []

        for function in list_of_F:
            match function:
                case "usual":
                    preference_functions.append(promethee._usual_function)
                case "u-shape":
                    preference_functions.append(promethee._ushape_function)
                case "v-shape":
                    preference_functions.append(promethee._vshape_function)
                case "level":
                    preference_functions.append(promethee._level_function)
                case "gaussian":
                    preference_functions.append(promethee._gaussian_function)
                case "linear":
                    preference_functions.append(promethee._linear_function)


        preferences = promethee(
            matrix=matrix,
            weights=weights,
            types=types,
            preference_functions=preference_functions,
            p=P,
            q=Q,
        )

        ranking = np.argsort(preferences)[::-1]

        indeks_map = {wartosc : indeks for indeks, wartosc in enumerate(ranking)}

        lista_obiektow_posortowana = [sets_list[i] for i in sorted(indeks_map, key=indeks_map.get)]


        gaia_results = calculate_gaia_pca(matrix, weights)

        names = [obj.name for obj in sets_list]
        result_gaia = format_gaia_results(gaia_results,names ,list_of_criterias)

        decision_axis= calculate_decision_axis(result_gaia["criterias"],weights)


        ranking_list =[]

        for rank, alt in enumerate(ranking):
            ranking_list.append(Ranking(name= lista_obiektow_posortowana[rank].name, value=preferences[alt]))


        request_data = CriteriaRequest(sets = lista_obiektow_posortowana,
                                       criterias=criteria_list, rankings = ranking_list,
                                       gaia_properties = result_gaia, decision_axis= decision_axis)

        return request_data

    except ValueError as e:
        print(f"Validation error: {str(e)}")
        return {"error": f"Validation error: {str(e)}"}
    except Exception as e:
        print(f"General error: {str(e)}")
        return {"error": str(e)}


app.include_router(router)

