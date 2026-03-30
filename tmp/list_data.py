import requests
import json

def list_objects_and_types():
    base_url = "http://localhost:8000"
    
    # Get all types
    type_res = requests.get(f"{base_url}/object-types/")
    types = type_res.json().get("items", [])
    print("--- Current Types ---")
    for t in types:
        print(f"ID: {t['id']} | Name: {t['name']} | Slug: {t.get('slug', 'N/A')}")
    
    # Get all objects
    obj_res = requests.get(f"{base_url}/objects/?limit=100")
    objects = obj_res.json().get("items", [])
    print("\n--- Current Objects ---")
    for obj in objects:
        type_name = "NONE"
        if obj.get("type_id"):
            type_match = next((t for t in types if t["id"] == obj["type_id"]), None)
            type_name = type_match["name"] if type_match else obj["type_id"]
        print(f"ID: {obj['id']} | Name: {obj['name']} | Type: {type_name}")

if __name__ == "__main__":
    list_objects_and_types()
