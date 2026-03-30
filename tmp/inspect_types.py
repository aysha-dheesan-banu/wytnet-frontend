import requests
import json

BASE_URL = "http://localhost:8000"

def inspect_types():
    try:
        res = requests.get(f"{BASE_URL}/object-types/")
        print("GET /object-types/ Status:", res.status_code)
        print("Response Body:", json.dumps(res.json(), indent=2))
        
        # Try to find Product and Instruments
        items = res.json().get("items", [])
        if not items and isinstance(res.json(), list):
             items = res.json()
             
        for t in items:
            print(f"Type Found - ID: {t.get('id')} | Name: {t.get('name')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_types()
