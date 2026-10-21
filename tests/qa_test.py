#!/usr/bin/env python
"""
Comprehensive QA Test Suite for Traffic Congestion & Fuel Prediction System
Tests all major functionality end-to-end
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

API_URL = os.getenv("API_URL", "http://localhost:8000")

class QATestSuite:
    def __init__(self):
        self.test_results = []
        self.user_token = None
        self.analyst_token = None
        self.test_user_email = f"qatest_{int(time.time())}@example.com"
        self.test_analyst_email = f"analyst_{int(time.time())}@example.com"
        
    def log(self, title, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{status}] {title}")
        if message:
            print(f"            {message}")
    
    def test_case(self, test_name, test_func):
        """Run a test case and record results"""
        try:
            self.log(test_name, "", "TEST")
            result = test_func()
            status = "PASS" if result else "FAIL"
            self.test_results.append((test_name, status))
            self.log(test_name, f"Result: {status}", status)
            return result
        except Exception as e:
            self.test_results.append((test_name, "ERROR"))
            self.log(test_name, f"Error: {str(e)}", "ERROR")
            return False
    
    def test_signup_user(self):
        """Test creating a new USER account"""
        response = requests.post(
            f"{API_URL}/auth/signup",
            json={
                "name": "QA Test Commuter",
                "email": self.test_user_email,
                "password": "QAPassword123",
                "role": "USER"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.user_token = data['access_token']
            print(f"            User ID: {data['user']['id']}, Email: {data['user']['email']}, Role: {data['user']['role']}")
            return True
        else:
            print(f"            Status {response.status_code}: {response.text}")
            return False
    
    def test_signup_analyst(self):
        """Test creating a new ANALYST account"""
        response = requests.post(
            f"{API_URL}/auth/signup",
            json={
                "name": "QA Test Analyst",
                "email": self.test_analyst_email,
                "password": "QAPassword123",
                "role": "ANALYST"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.analyst_token = data['access_token']
            print(f"            User ID: {data['user']['id']}, Role: {data['user']['role']}")
            return True
        else:
            print(f"            Status {response.status_code}: {response.text}")
            return False
    
    def test_login_valid(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": self.test_user_email,
                "password": "QAPassword123"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Token issued for: {data['user']['name']}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def test_login_invalid(self):
        """Test login with invalid credentials (should fail)"""
        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": self.test_user_email,
                "password": "WrongPassword"
            }
        )
        
        if response.status_code == 401:
            print(f"            Correctly rejected invalid credentials")
            return True
        else:
            print(f"            Expected 401, got {response.status_code}")
            return False
    
    def test_predict_congestion(self):
        """Test congestion prediction"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(
            f"{API_URL}/predict-congestion?segment_id=SEG-101&target_time=Now",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Segment: {data.get('segment_id')}")
            print(f"            Speed: {data.get('predicted_speed')} km/h")
            print(f"            Level: {data.get('congestion_level')}")
            print(f"            Model: {data.get('model_version')}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def test_predict_fuel(self):
        """Test fuel estimation"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.post(
            f"{API_URL}/predict-fuel",
            json={
                "route": ["SEG-101", "SEG-102"],
                "vehicle": {
                    "vehicle_type": "medium sedan",
                    "base_efficiency": 8.5
                }
            },
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Distance: {data.get('total_distance_km')} km")
            print(f"            Fuel: {data.get('predicted_fuel_l')} L")
            print(f"            Cost: ${data.get('estimated_cost'):.2f}")
            return True
        else:
            print(f"            Status {response.status_code}: {response.text}")
            return False
    
    def test_compare_routes(self):
        """Test route comparison"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.post(
            f"{API_URL}/compare-routes",
            json={
                "route_a": ["SEG-101", "SEG-102"],
                "route_b": ["SEG-103", "SEG-104"],
                "vehicle": {
                    "vehicle_type": "medium sedan",
                    "base_efficiency": 8.5
                }
            },
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Route A Fuel: {data['route_a'].get('predicted_fuel_l')} L")
            print(f"            Route B Fuel: {data['route_b'].get('predicted_fuel_l')} L")
            print(f"            Recommendation: {data.get('recommendation')}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def test_historical_trends(self):
        """Test historical analytics"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(
            f"{API_URL}/analytics/history?segment_id=SEG-101",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Segment: {data.get('segment_id')}")
            print(f"            Data points: {len(data.get('data', []))}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def test_data_sources(self):
        """Test data sources status"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(
            f"{API_URL}/sources/status",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Sources: {len(data.get('sources', []))}")
            for source in data.get('sources', []):
                print(f"              - {source['name']}: {source['status']}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def test_rbac_user_denied(self):
        """Test that USER is denied access to retraining"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.post(
            f"{API_URL}/models/retrain",
            json={
                "model_type": "both",
                "training_window": "2023-01-01 to 2026-08-01"
            },
            headers=headers
        )
        
        if response.status_code == 403:
            print(f"            USER correctly denied with 403")
            return True
        else:
            print(f"            Expected 403, got {response.status_code}")
            return False
    
    def test_retrain_analyst(self):
        """Test model retraining as ANALYST"""
        headers = {"Authorization": f"Bearer {self.analyst_token}"}
        response = requests.post(
            f"{API_URL}/models/retrain",
            json={
                "model_type": "both",
                "training_window": "2023-01-01 to 2026-08-01"
            },
            headers=headers,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Status: {data.get('status')}")
            return True
        else:
            print(f"            Status {response.status_code}: {str(response.text)[:100]}")
            return False
    
    def test_model_metrics(self):
        """Test retrieving model metrics"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(
            f"{API_URL}/models/metrics?model_type=congestion",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"            Metrics: {list(data.keys())}")
            return True
        else:
            print(f"            Status {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all QA tests"""
        print("\n" + "="*70)
        print("QA TEST SUITE - COMPREHENSIVE APPLICATION TESTING")
        print("="*70 + "\n")
        
        # Auth tests
        print("[SECTION: AUTHENTICATION]")
        self.test_case("Signup - Create USER", self.test_signup_user)
        self.test_case("Signup - Create ANALYST", self.test_signup_analyst)
        self.test_case("Login - Valid credentials", self.test_login_valid)
        self.test_case("Login - Invalid password", self.test_login_invalid)
        
        print("\n[SECTION: CONGESTION PREDICTION]")
        self.test_case("Predict Congestion", self.test_predict_congestion)
        
        print("\n[SECTION: FUEL ESTIMATION]")
        self.test_case("Predict Fuel", self.test_predict_fuel)
        
        print("\n[SECTION: ROUTE COMPARISON]")
        self.test_case("Compare Routes", self.test_compare_routes)
        
        print("\n[SECTION: ANALYTICS]")
        self.test_case("Historical Trends", self.test_historical_trends)
        
        print("\n[SECTION: DATA MANAGEMENT]")
        self.test_case("Data Sources Status", self.test_data_sources)
        self.test_case("Model Metrics", self.test_model_metrics)
        
        print("\n[SECTION: RBAC / AUTHORIZATION]")
        self.test_case("RBAC - USER denied retraining", self.test_rbac_user_denied)
        self.test_case("Retrain Model - ANALYST allowed", self.test_retrain_analyst)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for _, status in self.test_results if status == "PASS")
        failed = sum(1 for _, status in self.test_results if status == "FAIL")
        errors = sum(1 for _, status in self.test_results if status == "ERROR")
        total = len(self.test_results)
        
        for test_name, status in self.test_results:
            symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "⚠"
            print(f"{symbol} {test_name:<50} {status}")
        
        print("\n" + "-"*70)
        print(f"Total: {total} | Passed: {passed} | Failed: {failed} | Errors: {errors}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        print("="*70 + "\n")

if __name__ == "__main__":
    suite = QATestSuite()
    suite.run_all_tests()
