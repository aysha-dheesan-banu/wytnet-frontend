import requests
import json

BASE_URL = "http://localhost:8000"

def debug_objects():
    try:
        # 1. Get objects
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        # 2. Get types for reference
        t_res = requests.get(f"{BASE_URL}/object-types/")
        types = t_res.json()
        if isinstance(types, dict): types = types.get("items", [])
        type_map = {t['id']: t['name'] for t in types}
        
        print("--- OBJECT DATA DEBUG ---")
        for obj in objects:
            t_name = type_map.get(obj['type_id'], 'UNKNOWN')
            print(f"Name: {obj['name']:15} | Type: {t_name:10} | Icon: '{obj['icon']}'")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_objects()
