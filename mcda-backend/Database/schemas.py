from typing import List,Optional, Generic, TypeVar,Dict
from pydantic import BaseModel


T = TypeVar('T')


class GaiaCriteria(BaseModel):
    name: str
    x: float
    y: float

class GaiaAlternative(BaseModel):
    name: str
    x: float
    y: float

class GAIAOutput(BaseModel):
    criterias: List[GaiaCriteria]
    alternatives: List[GaiaAlternative]
    explained_variance: List[float]

class Criteria(BaseModel):
    name: Optional[str] = ""
    weight: Optional[float] = 0
    Q: Optional[float] = 0
    P: Optional[float] = 0
    S: Optional[float] = 0
    type: Optional[str] = ""
    promethee2Method: Optional[str]= ""

class Sets(BaseModel):
    set_num: Optional[str] = ""
    name: Optional[str] = ""
    year: Optional[int] = 0
    price: Optional[float] = 0
    theme_name: Optional[str] = ""
    num_parts: Optional[int] = 0
    img_url: Optional[str] = ""
    num_minifigs: Optional[int] = 0

class Ranking(BaseModel):
    name: Optional[str] = ""
    value: Optional[float] = 0.0

class CriteriaRequest(BaseModel):
    sets: List[Sets]
    criterias: List[Criteria]
    rankings: List[Ranking]
    gaia_properties: GAIAOutput
    decision_axis: List[float]
