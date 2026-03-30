import requests

BASE_URL = "http://localhost:8000"

def fix():
    # 1. Get all types
    types_res = requests.get(f"{BASE_URL}/object-types/")
    types = types_res.json()
    if isinstance(types, dict):
        types = types.get("items", [])
    
    product_id = next((t["id"] for t in types if t["name"].lower() == "product"), None)
    instrument_id = next((t["id"] for t in types if t["name"].lower() in ["instruments", "instrument"]), None)
    
    # 2. Create if missing
    if not product_id:
        print("Creating Product type...")
        res = requests.post(f"{BASE_URL}/object-types/", json={"name": "Product", "slug": "product", "is_tangible": True})
        product_id = res.json().get("item", {}).get("id") or res.json().get("id")

    if not instrument_id:
        print("Creating Instruments type...")
        res = requests.post(f"{BASE_URL}/object-types/", json={"name": "Instruments", "slug": "instruments", "is_tangible": True})
        instrument_id = res.json().get("item", {}).get("id") or res.json().get("id")

    print(f"Product ID: {product_id} | Instrument ID: {instrument_id}")

    # 3. Update objects
    objs_res = requests.get(f"{BASE_URL}/objects/?limit=100")
    objects = objs_res.json().get("items", [])
    
    for obj in objects:
        name = obj["name"].lower()
        if name in ["textbook", "pen", "bottle", "laptop"]:
             print(f"Updating {obj['name']} to PRODUCT...")
             requests.put(f"{BASE_URL}/objects/{obj['id']}", json={"type_id": product_id})
        elif name == "keyboard":
             print(f"Updating {obj['name']} to INSTRUMENTS...")
             requests.put(f"{BASE_URL}/objects/{obj['id']}", json={"type_id": instrument_id})

if __name__ == "__main__":
    fix()
