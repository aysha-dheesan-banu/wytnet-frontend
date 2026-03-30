import requests

def patch_data():
    base_url = "http://localhost:8000"
    
    # 1. Ensure types exist
    type_res = requests.get(f"{base_url}/object-types/")
    types = type_res.json().get("items", [])
    
    product_type = next((t for t in types if t["name"].lower() == "product"), None)
    instrument_type = next((t for t in types if t["name"].lower() == "instruments"), None)
    
    if not product_type:
        print("Creating Product type...")
        res = requests.post(f"{base_url}/object-types/", json={"name": "Product", "slug": "product", "is_tangible": True})
        product_type = res.json().get("item")
    
    if not instrument_type:
        print("Creating Instruments type...")
        res = requests.post(f"{base_url}/object-types/", json={"name": "Instruments", "slug": "instruments", "is_tangible": True})
        instrument_type = res.json().get("item")

    # 2. Update objects
    obj_res = requests.get(f"{base_url}/objects/?limit=100")
    objects = obj_res.json().get("items", [])
    
    updates = [
        {"names": ["Textbook", "Pen", "Bottle"], "type_id": product_type["id"]},
        {"names": ["Keyboard"], "type_id": instrument_type["id"]}
    ]
    
    for update in updates:
        for name in update["names"]:
            match = next((o for o in objects if o["name"].lower() == name.lower()), None)
            if match:
                print(f"Updating {name} to type ID {update['type_id']}...")
                requests.put(f"{base_url}/objects/{match['id']}", json={"type_id": update["type_id"]})

if __name__ == "__main__":
    patch_data()
