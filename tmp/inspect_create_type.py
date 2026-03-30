import requests
import json

BASE_URL = "http://localhost:8000"

def create_and_inspect():
    try:
        # 1. Create Instruments
        print("Attempting to create Instruments type...")
        res = requests.post(f"{BASE_URL}/object-types/", json={
            "name": "Instruments",
            "slug": "instruments",
            "is_tangible": True
        })
        print(f"POST Status: {res.status_code}")
        print("POST Response:", json.dumps(res.json(), indent=2))
        
        # 2. Get all types to verify
        res = requests.get(f"{BASE_URL}/object-types/")
        print("\nGET Status:", res.status_code)
        print("GET Response:", json.dumps(res.json(), indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_and_inspect()
