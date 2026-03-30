import requests

BASE_URL = "http://localhost:8000"

def get_or_create_type(name):
    # Get all types
    res = requests.get(f"{BASE_URL}/object-types/")
    types = res.json().get("items", [])
    
    # Look for match
    for t in types:
        if t["name"].lower() == name.lower():
            return t["id"]
            
    # Create if not found
    print(f"Creating type: {name}")
    res = requests.post(f"{BASE_URL}/object-types/", json={
        "name": name,
        "slug": name.lower(),
        "is_tangible": True
    })
    # The API might return the item directly or in a wrapper
    data = res.json()
    if "item" in data:
        return data["item"]["id"]
    return data.get("id")

def fix_object_types():
    try:
        product_id = get_or_create_type("Product")
        instrument_id = get_or_create_type("Instruments")
        
        if not product_id or not instrument_id:
            print("Failed to get type IDs")
            return

        # Get all objects
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        mapping = {
            "Textbook": product_id,
            "Pen": product_id,
            "Bottle": product_id,
            "Keyboard": instrument_id
        }
        
        for obj in objects:
            name = obj["name"]
            if name in mapping:
                new_type_id = mapping[name]
                print(f"Updating {name} to type {new_type_id}")
                requests.put(f"{BASE_URL}/objects/{obj['id']}", json={
                    "type_id": new_type_id
                })
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_object_types()
