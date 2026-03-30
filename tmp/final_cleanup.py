import requests

BASE_URL = "http://localhost:8000"

def final_cleanup():
    try:
        # 1. Get all objects
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        laptop = next((o for o in objects if o["name"].lower() == "laptop"), None)
        computer_obj = next((o for o in objects if o["name"].lower() == "computer"), None)
        
        if computer_obj:
            print(f"Deleting duplicate 'computer' object (ID: {computer_obj['id']})...")
            d_res = requests.delete(f"{BASE_URL}/objects/{computer_obj['id']}")
            print(f"Delete Status: {d_res.status_code}")
            
        if laptop:
            print(f"Adding aliases to Laptop (ID: {laptop['id']})...")
            # Clear existing 'computer' alias first to be safe (no, we can just add)
            # Add 'Product' as an alias
            a_res = requests.post(f"{BASE_URL}/object-aliases/", json={
                "object_id": laptop['id'],
                "alias": "Product"
            })
            print(f"Add 'Product' Status: {a_res.status_code}")
            
            # Ensure 'Computer' is also there as an alias (case-sensitive as user wants)
            a_res2 = requests.post(f"{BASE_URL}/object-aliases/", json={
                "object_id": laptop['id'],
                "alias": "Computer"
            })
            print(f"Add 'Computer' Status: {a_res2.status_code}")
            
        print("Cleanup Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_cleanup()
