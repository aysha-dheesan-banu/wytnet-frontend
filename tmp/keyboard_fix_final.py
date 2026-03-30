import requests

BASE_URL = "http://localhost:8000"

def final_keyboard_fix():
    try:
        # 1. Get all types
        types_res = requests.get(f"{BASE_URL}/object-types/")
        types = types_res.json()
        if isinstance(types, dict): types = types.get("items", [])
        
        # 2. Look for Instruments ID
        inst_id = next((t['id'] for t in types if t['name'].lower() in ['instruments', 'instrument']), None)
        
        # 3. Create if missing
        if not inst_id:
            print("Creating Instruments type...")
            res = requests.post(f"{BASE_URL}/object-types/", json={
                "name": "Instruments",
                "slug": "instruments",
                "is_tangible": True
            })
            data = res.json()
            # Handle different API response shapes
            inst_id = data.get("item", {}).get("id") or data.get("id")
        
        if not inst_id:
            print("FAILED to get Instruments ID")
            return

        print(f"DEBUG: Using Instrument ID {inst_id}")

        # 4. Get items and match Keyboard
        objs_res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = objs_res.json().get("items", [])
        
        keyboard = next((o for o in objects if o["name"].lower() == "keyboard"), None)
        if keyboard:
            print(f"Updating {keyboard['name']} (ID: {keyboard['id']}) to type ID {inst_id}...")
            res = requests.put(f"{BASE_URL}/objects/{keyboard['id']}", json={
                "type_id": inst_id
            })
            if res.status_code == 200:
                print("SUCCESSFULLY updated Keyboard to Instruments!")
            else:
                print(f"FAILED to update Keyboard: {res.text}")
        else:
            # Maybe it's missing or named differently
            print("Keyboard object NOT FOUND in the list!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_keyboard_fix()
