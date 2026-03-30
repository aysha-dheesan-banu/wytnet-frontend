import requests

BASE_URL = "http://localhost:8000"

def fix_all_final():
    try:
        # 1. Get types and find/create Instruments
        res = requests.get(f"{BASE_URL}/object-types/")
        types = res.json()
        if isinstance(types, dict): types = types.get("items", [])
        
        product_id = next((t['id'] for t in types if t['name'].lower() == 'product'), None)
        instrument_id = next((t['id'] for t in types if t['name'].lower() in ['instruments', 'instrument']), None)
        
        if not instrument_id:
            print("Creating Instruments type...")
            res = requests.post(f"{BASE_URL}/object-types/", json={"name": "Instruments", "slug": "instruments", "is_tangible": True})
            data = res.json()
            instrument_id = data.get("item", {}).get("id") or data.get("id")
            
        print(f"IDs: Product={product_id}, Instruments={instrument_id}")
        
        # 2. Get and update objects
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        for obj in objects:
            name = obj['name'].strip().lower()
            update_data = {}
            
            # Type Fixes
            if name == 'keyboard':
                update_data['type_id'] = instrument_id
            elif name in ['laptop', 'textbook', 'pen', 'bottle']:
                update_data['type_id'] = product_id
                
            # Icon Fixes (Always ensure they have 'category' if no real image)
            # We already fixed 'string', 'icon', etc. but maybe something else is there
            if not obj['icon'] or len(obj['icon'].strip()) < 3 or obj['icon'] in ['string', 'icon', './', '.']:
                update_data['icon'] = 'category'
            
            if update_data:
                print(f"Final Update {obj['name']}: {update_data}")
                requests.put(f"{BASE_URL}/objects/{obj['id']}", json=update_data)
                
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_all_final()
