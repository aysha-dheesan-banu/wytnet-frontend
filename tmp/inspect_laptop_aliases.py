import requests

BASE_URL = "http://localhost:8000"

def inspect_laptop():
    try:
        # Get Laptop object
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        laptop = next((o for o in objects if o["name"].lower() == "laptop"), None)
        if laptop:
            print(f"LAPTOP Object Found: {laptop['id']}")
            # Wait, the list_objects response (APIResponse) might have aliases nested?
            # Let's check the raw object data again to see if aliases are there.
            
            # Or fetch specifically
            a_res = requests.get(f"{BASE_URL}/object-aliases/{laptop['id']}")
            aliases = a_res.json().get("items", [])
            print("LAPTOP Aliases:")
            for a in aliases:
                print(f"- {a['alias']}")
        
        # Check if 'computer' exists as an object
        computer_obj = next((o for o in objects if o["name"].lower() == "computer"), None)
        if computer_obj:
            print(f"DUPLICATE 'computer' OBJECT FOUND: {computer_obj['id']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_laptop()
