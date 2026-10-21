import requests
import json

BASE_URL = 'http://localhost:8000'

# Test 1: Signup
print("=== TEST 1: SIGNUP ===")
signup_data = {
    'name': 'Test Commuter',
    'email': 'commuter@test.com',
    'password': 'commuter123',
    'role': 'USER'
}

r = requests.post(f'{BASE_URL}/auth/signup', json=signup_data)
print(f'Status: {r.status_code}')
signup_result = r.json()
if r.status_code == 200:
    print(f'✓ User created: {signup_result["user"]["name"]}')
    print(f'✓ Email: {signup_result["user"]["email"]}')
    print(f'✓ Role: {signup_result["user"]["role"]}')
    user_token = signup_result['access_token']
else:
    print(f'✗ Error: {signup_result}')
    user_token = None

# Test 2: Login
print("\n=== TEST 2: LOGIN ===")
login_data = {
    'email': 'commuter@test.com',
    'password': 'commuter123'
}

r = requests.post(f'{BASE_URL}/auth/login', json=login_data)
print(f'Status: {r.status_code}')
login_result = r.json()
if r.status_code == 200:
    print(f'✓ Login successful')
    print(f'✓ User: {login_result["user"]["name"]} ({login_result["user"]["role"]})')
    user_token = login_result['access_token']
else:
    print(f'✗ Error: {login_result}')

if user_token:
    # Test 3: Get current user
    print("\n=== TEST 3: GET CURRENT USER ===")
    headers = {'Authorization': f'Bearer {user_token}'}
    r = requests.get(f'{BASE_URL}/auth/me', headers=headers)
    print(f'Status: {r.status_code}')
    me_result = r.json()
    if r.status_code == 200:
        print(f'✓ Current user: {me_result}')
    else:
        print(f'✗ Error: {me_result}')

    print("\n=== TEST 4: CONGESTION PREDICTION ===")
    r = requests.get(f'{BASE_URL}/predict-congestion?segment_id=SEG-101&target_time=Now', headers=headers)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        pred = r.json()
        print(f'✓ Prediction retrieved for {pred.get("segment_id")}')
        print(f'  Speed: {pred.get("predicted_speed")} km/h')
        print(f'  Congestion: {pred.get("congestion_level")}')
    else:
        print(f'✗ Error: {r.json()}')

    print("\n=== TEST 5: FUEL PREDICTION ===")
    fuel_req = {
        'route': ['SEG-101', 'SEG-102', 'SEG-103'],
        'vehicle': {
            'vehicle_type': 'sedan',
            'base_efficiency': 8.5
        }
    }

    r = requests.post(f'{BASE_URL}/predict-fuel', json=fuel_req, headers=headers)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        fuel = r.json()
        print(f'✓ Fuel prediction: {fuel.get("predicted_fuel_l")} L')
        print(f'  Estimated cost: ${fuel.get("estimated_cost"):.2f}')
    else:
        print(f'✗ Error: {r.json()}')

print("\n=== All tests completed ===")
