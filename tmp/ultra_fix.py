import requests

BASE_URL = "http://localhost:8000"

def final_fix():
    try:
        # 1. Get all types and identify IDs
        types_res = requests.get(f"{BASE_URL}/object-types/")
        types = types_res.json()
        if isinstance(types, dict): types = types.get("items", [])
        
        product_id = next((t['id'] for t in types if t['name'].lower() == 'product'), None)
        instrument_id = next((t['id'] for t in types if t['name'].lower() == 'instruments'), None)
        
        print(f"DEBUG: Product={product_id}, Instrument={instrument_id}")
        
        # 2. Get all objects
        obj_res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = obj_res.json().get("items", [])
        
        for obj in objects:
            name = obj['name'].strip().lower()
            update_data = {}
            
            # Map type
            if name in ['laptop', 'textbook', 'pen', 'bottle']:
                if product_id and obj['type_id'] != product_id:
                    update_data['type_id'] = product_id
            elif name == 'keyboard':
                if instrument_id and obj['type_id'] != instrument_id:
                    update_data['type_id'] = instrument_id
            
            # Reset broken icons to 'category'
            if obj['icon'] in ['string', 'icon', './', '.']:
                update_data['icon'] = 'category'
                
            if update_data:
                print(f"Updating {obj['name']}: {update_data}")
                res = requests.put(f"{BASE_URL}/objects/{obj['id']}", json=update_data)
                if res.status_code != 200:
                    print(f"FAILED to update {obj['name']}: {res.text}")
                    
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_fix()
