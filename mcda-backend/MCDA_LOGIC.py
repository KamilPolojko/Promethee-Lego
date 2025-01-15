
# TO JEST KOD KTÓRY POSŁUŻYŁ ZA SCRAPOWANIE DANYCH ALE SĄ ONE JUZ W CSV ALE ZOSTAWIAM W RAZIE W


# import requests
# from bs4 import BeautifulSoup
# import re
#
#
# def fetch_price_for_set(set_id):
#     url = f"https://rebrickable.com/sets/{set_id}/"
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
#
#     response = requests.get(url, headers=headers)
#
#     if response.status_code != 200:
#         print(f"Error fetching data for set {set_id}: HTTP {response.status_code}")
#         return None
#
#     soup = BeautifulSoup(response.content, 'html.parser')
#     page_text = soup.get_text()
#
#     price_match = re.search(r"PLN\s?\d+(\.\d{2})?", page_text)
#     if price_match:
#         price = price_match.group(0)
#         print(f"Price for set {set_id}: {price}")
#         return price
#     else:
#         print(f"No price found for set {set_id}")
#         return None
#
#
# import csv
# import time
#
#
#
# def load_set_ids_from_csv(input_file):
#     set_ids = []
#     try:
#         with open(input_file, 'r') as file:
#             reader = csv.DictReader(file)
#
#             print(f"Headers in CSV: {reader.fieldnames}")
#
#             for row in reader:
#                 set_ids.append(row['set_num'])
#     except KeyError as e:
#         print(f"Error: Missing expected column {e} in input file!")
#     except Exception as e:
#         print(f"Error reading input file {input_file}: {e}")
#     return set_ids


# def save_prices_to_csv(output_file, prices_data):
#     with open(output_file, 'w', newline='') as file:
#         writer = csv.writer(file)
#         writer.writerow(['set_num', 'price'])
#         writer.writerows(prices_data)
#
#
# def main():
#     input_file = 'sets_above_2022.csv'
#     output_file = 'sets_prices.csv'
#
#     set_ids = load_set_ids_from_csv(input_file)
#     if not set_ids:
#         print("No set IDs found in input file!")
#         return
#
#     prices_data = []
#     for set_id in set_ids:
#         price = fetch_price_for_set(set_id)
#         prices_data.append((set_id, price))
#         time.sleep(5)
#
#     save_prices_to_csv(output_file, prices_data)
#     print(f"Prices saved to {output_file}")
#
#
# if __name__ == "__main__":
#     main()


import csv
import psycopg2
from psycopg2 import sql


def connect_to_db():
    return psycopg2.connect(
        dbname="lego",
        user="postgres",
        password="123",
        host="localhost",
        port=5432
    )


def update_prices_from_csv(csv_file, conn):
    cursor = conn.cursor()

    with open(csv_file, 'r') as file:
        reader = csv.DictReader(file)

        for row in reader:
            set_id = row['set_num']
            raw_price = row['price']

            if raw_price.startswith("PLN"):
                price = float(raw_price.replace("PLN", "").strip())
            else:
                print(f"Invalid price format for set {set_id}: {raw_price}")
                continue

            query = sql.SQL("UPDATE sets SET price = %s WHERE set_num = %s")

            try:
                cursor.execute(query, (price, set_id))
            except Exception as e:
                print(f"Error updating price for set {set_id}: {e}")

    conn.commit()
    cursor.close()


csv_file = 'sets_prices.csv'

conn = connect_to_db()
try:
    update_prices_from_csv(csv_file, conn)
    print("Prices updated successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()




