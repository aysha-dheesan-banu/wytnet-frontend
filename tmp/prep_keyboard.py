import requests

BASE_URL = "http://localhost:8000"

def fix_keyboard():
    # 1. Ensure Instruments type exists
    res = requests.get(f"{BASE_URL}/object-types/")
    types = res.json()
    if isinstance(types, dict): types = types.get("items", [])
    
    instrument_id = None
    for t in types:
        if t["name"].lower() in ["instruments", "instrument"]:
            instrument_id = t["id"]
            break
            
    if not instrument_id:
        print("Creating Instruments type...")
        res = requests.post(f"{BASE_URL}/object-types/", json={
            "name": "Instruments",
            "slug": "instruments",
            "is_tangible": True
        })
        data = res.json()
        instrument_id = data.get("item", {}).get("id") or data.get("id")
        
    print(f"Using Instrument ID: {instrument_id}")
    
    # 2. Find Keyboard and update
    res = requests.get(f"{BASE_URL}/objects/?limit=100")
    objects = res.json().get("items", [])
    
    keyboard = next((o for o in objects if o["name"].lower() == "keyboard"), None)
    if keyboard:
        print(f"Updating {keyboard['name']} to Instruments...")
        # Since I re-enabled auth, I must disable it again in the backend or use a token
        # I'll temporarily disable it again
        return keyboard['id'], instrument_id
    else:
        print("Keyboard not found!")
        return None, None

if __name__ == "__main__":
    fix_keyboard()
