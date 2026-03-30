import requests

BASE_URL = "http://localhost:8000"

def verify_counts():
    try:
        res = requests.get(f"{BASE_URL}/objects/?limit=100")
        objects = res.json().get("items", [])
        
        print(f"{'Name':<20} | {'Parent':<15} | {'Children':<10}")
        print("-" * 50)
        for obj in objects:
            print(f"{obj['name']:<20} | {obj.get('parent_name', 'None'):<15} | {obj.get('child_count', 0):<10}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_counts()
