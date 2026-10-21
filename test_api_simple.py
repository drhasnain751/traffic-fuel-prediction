#!/usr/bin/env python
"""
QA Test - Direct API testing with minimal dependencies
"""
import json

# Test via direct Python HTTP calls
def test_api():
    import urllib.request
    import urllib.error
    
    API_URL = "http://localhost:8000"
    
    print("Testing API endpoints...\n")
    
    # Test 1: Signup
    print("[1] SIGNUP TEST")
    data = {
        "name": "QA Test User",
        "email": "qatest@example.com",
        "password": "QATest123",
        "role": "USER"
    }
    req = urllib.request.Request(
        f"{API_URL}/auth/signup",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"✓ User created: {result['user']['email']}")
            print(f"  ID: {result['user']['id']}, Role: {result['user']['role']}")
            token = result['access_token']
    except urllib.error.HTTPError as e:
        print(f"✗ Error: {e.code} - {e.reason}")
        return
    
    # Test 2: Login
    print("\n[2] LOGIN TEST")
    data = {
        "email": "qatest@example.com",
        "password": "QATest123"
    }
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"✓ Login successful for: {result['user']['name']}")
    except urllib.error.HTTPError as e:
        print(f"✗ Error: {e.code}")
    
    # Test 3: Congestion Prediction
    print("\n[3] CONGESTION PREDICTION")
    req = urllib.request.Request(
        f"{API_URL}/predict-congestion?segment_id=SEG-101&target_time=Now",
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"✓ Prediction returned")
            print(f"  Speed: {result['predicted_speed']} km/h")
            print(f"  Level: {result['congestion_level']}")
    except urllib.error.HTTPError as e:
        print(f"✗ Error: {e.code}")
    
    # Test 4: Fuel Estimation
    print("\n[4] FUEL ESTIMATION")
    data = {
        "route": ["SEG-101", "SEG-102"],
        "vehicle": {
            "vehicle_type": "medium sedan",
            "base_efficiency": 8.5
        }
    }
    req = urllib.request.Request(
        f"{API_URL}/predict-fuel",
        data=json.dumps(data).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"✓ Fuel prediction returned")
            print(f"  Distance: {result['total_distance_km']} km")
            print(f"  Fuel: {result['predicted_fuel_l']} L")
            print(f"  Cost: ${result['estimated_cost']:.2f}")
    except urllib.error.HTTPError as e:
        print(f"✗ Error: {e.code} - {e.reason}")
    
    print("\nAPI tests complete!")

if __name__ == "__main__":
    test_api()
