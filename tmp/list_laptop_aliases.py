import requests

BASE_URL = "http://localhost:8000"

def list_all_aliases():
    try:
        # Get Laptop object
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        laptop = next((o for o in objects if o["name"].lower() == "laptop"), None)
        if laptop:
            print(f"LAPTOP ID: {laptop['id']}")
            a_res = requests.get(f"{BASE_URL}/object-aliases/{laptop['id']}")
            aliases = a_res.json().get("items", [])
            print("--- LAPTOP ALIASES ---")
            for a in aliases:
                print(f"* {a['alias']}")
        else:
            print("Laptop not found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_all_aliases()
