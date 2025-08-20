import requests
import json

# Base URL for the API
BASE_URL = 'http://127.0.0.1:8000/api/'

def test_manager_login():
    """Test manager login endpoint"""
    url = f"{BASE_URL}manager/login/"
    data = {
        'username': 'admin',
        'password': 'admin123'
    }
    response = requests.post(url, json=data)
    print("\n=== Manager Login Test ===")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login successful!")
        print("Response:", json.dumps(response.json(), indent=2))
    else:
        print(f"Login failed: {response.text}")

def test_staff_login():
    """Test staff login endpoint"""
    url = f"{BASE_URL}staff/login/"
    data = {
        'staff_id': 'STF0001'  # This should match the staff_id format in your system
    }
    response = requests.post(url, json=data)
    print("\n=== Staff Login Test ===")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login successful!")
        print("Response:", json.dumps(response.json(), indent=2))
    else:
        print(f"Login failed: {response.text}")

if __name__ == "__main__":
    test_manager_login()
    test_staff_login()
