import requests
import json

def verify_objects():
    url = "http://localhost:8000/objects/"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response Data (truncated):")
            print(json.dumps(data, indent=2)[:500])
            if "items" in data:
                print(f"Successfully fetched {len(data['items'])} objects.")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    verify_objects()
