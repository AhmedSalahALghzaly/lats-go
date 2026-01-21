#!/usr/bin/env python3
"""
Al-Ghazaly Auto Parts API v4.1.0 - Analytics & Subscriber Endpoints Testing
Testing newly implemented analytics and subscriber endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL configuration
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.passed = 0
        self.failed = 0
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        if success:
            self.passed += 1
        else:
            self.failed += 1
    
    def test_endpoint(self, method, endpoint, expected_status=None, auth_required=True, data=None):
        """Test an API endpoint"""
        url = f"{API_BASE}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                self.log_test(f"{method} {endpoint}", False, f"Unsupported method: {method}")
                return None
                
            # Check if endpoint exists (not 404)
            if response.status_code == 404:
                self.log_test(f"{method} {endpoint}", False, f"Endpoint not found (404)")
                return None
            
            # Check if method is allowed (not 405)
            if response.status_code == 405:
                self.log_test(f"{method} {endpoint}", False, f"Method not allowed (405)")
                return None
            
            # For auth-required endpoints, expect 401/403 when unauthenticated
            if auth_required and response.status_code in [401, 403]:
                self.log_test(f"{method} {endpoint}", True, f"Properly secured (HTTP {response.status_code})")
                return response
            
            # Check expected status if provided
            if expected_status and response.status_code == expected_status:
                self.log_test(f"{method} {endpoint}", True, f"HTTP {response.status_code}")
                return response
            
            # Check for successful responses
            if 200 <= response.status_code < 300:
                try:
                    json_data = response.json()
                    self.log_test(f"{method} {endpoint}", True, f"HTTP {response.status_code}, valid JSON response")
                    return response
                except:
                    self.log_test(f"{method} {endpoint}", True, f"HTTP {response.status_code}, non-JSON response")
                    return response
            else:
                self.log_test(f"{method} {endpoint}", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return response
                
        except requests.exceptions.ConnectionError:
            self.log_test(f"{method} {endpoint}", False, "Connection error - backend not accessible")
            return None
        except Exception as e:
            self.log_test(f"{method} {endpoint}", False, f"Exception: {str(e)}")
            return None
    
    def run_analytics_tests(self):
        """Test all new analytics endpoints"""
        print("\n" + "="*60)
        print("TESTING ANALYTICS ENDPOINTS")
        print("="*60)
        
        analytics_endpoints = [
            "/analytics/customers",
            "/analytics/products", 
            "/analytics/orders",
            "/analytics/revenue",
            "/analytics/admin-performance"
        ]
        
        for endpoint in analytics_endpoints:
            self.test_endpoint("GET", endpoint, auth_required=True)
            
        # Test with date parameters
        print("\n--- Testing Analytics with Date Parameters ---")
        date_params = "?start_date=2024-01-01&end_date=2024-12-31"
        for endpoint in analytics_endpoints:
            self.test_endpoint("GET", f"{endpoint}{date_params}", auth_required=True)
    
    def run_subscriber_tests(self):
        """Test new subscriber endpoints"""
        print("\n" + "="*60)
        print("TESTING SUBSCRIBER ENDPOINTS")
        print("="*60)
        
        # Test reject subscription request endpoint
        test_request_id = "test_request_123"
        self.test_endpoint("PATCH", f"/subscription-requests/{test_request_id}/reject", auth_required=True)
        
        # Test get single subscriber endpoint
        test_subscriber_id = "test_subscriber_123"
        self.test_endpoint("GET", f"/subscribers/{test_subscriber_id}", auth_required=True)
        
        # Test update subscriber endpoint
        update_data = {
            "name": "Updated Name",
            "email": "updated@example.com",
            "phone": "+1234567890"
        }
        self.test_endpoint("PUT", f"/subscribers/{test_subscriber_id}", auth_required=True, data=update_data)
    
    def run_existing_endpoints_verification(self):
        """Verify existing endpoints still work"""
        print("\n" + "="*60)
        print("VERIFYING EXISTING ENDPOINTS")
        print("="*60)
        
        # Test health check
        self.test_endpoint("GET", "/health", auth_required=False)
        
        # Test analytics overview (existing)
        self.test_endpoint("GET", "/analytics/overview", auth_required=True)
        
        # Test existing subscriber endpoints
        self.test_endpoint("GET", "/subscribers", auth_required=True)
        self.test_endpoint("GET", "/subscription-requests", auth_required=True)
    
    def run_all_tests(self):
        """Run all tests"""
        print("Al-Ghazaly Auto Parts API v4.1.0 - Analytics & Subscriber Endpoints Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Testing Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run test suites
        self.run_existing_endpoints_verification()
        self.run_analytics_tests()
        self.run_subscriber_tests()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed / (self.passed + self.failed) * 100):.1f}%")
        
        if self.failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']} - {result['details']}")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)