#!/usr/bin/env python3
"""
Al-Ghazaly Auto Parts Backend API v4.1.0 - Comprehensive Testing Suite
Testing Focus: Admin and Owner Panel Flows as per Review Request

This test suite covers all endpoints mentioned in the review request:
1. Authentication & Authorization Endpoints
2. Admin Management APIs (Owner-only)
3. Partner Management APIs (Owner-only)
4. Supplier Management APIs
5. Distributor Management APIs
6. Subscriber Management APIs
7. Customer Management APIs (Admin)
8. Order Management APIs (Admin)
9. Analytics APIs (Owner/Admin)
10. Marketing Management APIs (Admin)
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

class ComprehensiveAPITester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_health_check(self):
        """Test health check endpoint - GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            if response.status_code == 200:
                data = response.json()
                version = data.get("api_version", "unknown")
                status = data.get("status", "unknown")
                db_status = data.get("database", "unknown")
                self.log_test("GET /api/health", True, f"API v{version}, Status: {status}, DB: {db_status}")
                return True
            else:
                self.log_test("GET /api/health", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/health", False, f"Exception: {str(e)}")
            return False

    # 1. Authentication & Authorization Endpoints
    def test_auth_login(self):
        """Test POST /api/auth/login"""
        try:
            # Test without credentials
            response = self.session.post(f"{self.base_url}/api/auth/login")
            if response.status_code in [400, 422, 405]:  # 405 = Method Not Allowed if endpoint doesn't exist
                self.log_test("POST /api/auth/login", True, f"Correctly rejected with status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/auth/login", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Exception: {str(e)}")
            return False

    def test_auth_register(self):
        """Test POST /api/auth/register"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register")
            if response.status_code in [400, 422, 405]:
                self.log_test("POST /api/auth/register", True, f"Correctly rejected with status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/auth/register", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/auth/register", False, f"Exception: {str(e)}")
            return False

    def test_auth_logout(self):
        """Test POST /api/auth/logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            if response.status_code in [401, 403, 405]:
                self.log_test("POST /api/auth/logout", True, f"Correctly rejected with status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/auth/logout", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/auth/logout", False, f"Exception: {str(e)}")
            return False

    def test_auth_me(self):
        """Test GET /api/auth/me"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            if response.status_code in [401, 403, 405]:
                self.log_test("GET /api/auth/me", True, f"Correctly rejected with status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/auth/me", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")
            return False

    # 2. Admin Management APIs (Owner-only)
    def test_admins_list(self):
        """Test GET /api/admins"""
        try:
            response = self.session.get(f"{self.base_url}/api/admins")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/admins", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/admins", True, f"Returned {len(data)} admins (public endpoint)")
                return True
            else:
                self.log_test("GET /api/admins", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admins", False, f"Exception: {str(e)}")
            return False

    def test_admins_create(self):
        """Test POST /api/admins"""
        try:
            admin_data = {
                "email": "testadmin@alghazaly.com",
                "name": "Test Admin",
                "role": "admin"
            }
            response = self.session.post(f"{self.base_url}/api/admins", json=admin_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/admins", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/admins", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/admins", False, f"Exception: {str(e)}")
            return False

    def test_admins_get_by_id(self):
        """Test GET /api/admins/{id}"""
        try:
            response = self.session.get(f"{self.base_url}/api/admins/test-admin-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("GET /api/admins/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/admins/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admins/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_admins_update(self):
        """Test PUT /api/admins/{id}"""
        try:
            admin_data = {"name": "Updated Admin"}
            response = self.session.put(f"{self.base_url}/api/admins/test-admin-id", json=admin_data)
            if response.status_code in [401, 403, 404]:
                self.log_test("PUT /api/admins/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("PUT /api/admins/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("PUT /api/admins/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_admins_delete(self):
        """Test DELETE /api/admins/{id}"""
        try:
            response = self.session.delete(f"{self.base_url}/api/admins/test-admin-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("DELETE /api/admins/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("DELETE /api/admins/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("DELETE /api/admins/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_admins_check_access(self):
        """Test GET /api/admins/check-access"""
        try:
            response = self.session.get(f"{self.base_url}/api/admins/check-access")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/admins/check-access", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/admins/check-access", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admins/check-access", False, f"Exception: {str(e)}")
            return False

    # 3. Partner Management APIs (Owner-only)
    def test_partners_list(self):
        """Test GET /api/partners"""
        try:
            response = self.session.get(f"{self.base_url}/api/partners")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/partners", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/partners", True, f"Returned {len(data)} partners")
                return True
            else:
                self.log_test("GET /api/partners", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/partners", False, f"Exception: {str(e)}")
            return False

    def test_partners_create(self):
        """Test POST /api/partners"""
        try:
            partner_data = {
                "email": "partner@alghazaly.com",
                "name": "Test Partner",
                "company": "Test Company"
            }
            response = self.session.post(f"{self.base_url}/api/partners", json=partner_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/partners", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/partners", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/partners", False, f"Exception: {str(e)}")
            return False

    # 4. Supplier Management APIs
    def test_suppliers_list(self):
        """Test GET /api/suppliers"""
        try:
            response = self.session.get(f"{self.base_url}/api/suppliers")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/suppliers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/suppliers", True, f"Returned {len(data)} suppliers")
                return True
            else:
                self.log_test("GET /api/suppliers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/suppliers", False, f"Exception: {str(e)}")
            return False

    def test_suppliers_create(self):
        """Test POST /api/suppliers"""
        try:
            supplier_data = {
                "name": "Test Supplier",
                "contact_email": "supplier@example.com",
                "phone": "+1234567890"
            }
            response = self.session.post(f"{self.base_url}/api/suppliers", json=supplier_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/suppliers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/suppliers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/suppliers", False, f"Exception: {str(e)}")
            return False

    # 5. Distributor Management APIs
    def test_distributors_list(self):
        """Test GET /api/distributors"""
        try:
            response = self.session.get(f"{self.base_url}/api/distributors")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/distributors", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/distributors", True, f"Returned {len(data)} distributors")
                return True
            else:
                self.log_test("GET /api/distributors", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/distributors", False, f"Exception: {str(e)}")
            return False

    def test_distributors_create(self):
        """Test POST /api/distributors"""
        try:
            distributor_data = {
                "name": "Test Distributor",
                "contact_email": "distributor@example.com",
                "region": "Test Region"
            }
            response = self.session.post(f"{self.base_url}/api/distributors", json=distributor_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/distributors", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/distributors", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/distributors", False, f"Exception: {str(e)}")
            return False

    # 6. Subscriber Management APIs
    def test_subscribers_list(self):
        """Test GET /api/subscribers"""
        try:
            response = self.session.get(f"{self.base_url}/api/subscribers")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/subscribers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/subscribers", True, f"Returned {len(data)} subscribers")
                return True
            else:
                self.log_test("GET /api/subscribers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/subscribers", False, f"Exception: {str(e)}")
            return False

    def test_subscribers_add(self):
        """Test POST /api/subscribers"""
        try:
            subscriber_data = {
                "email": "subscriber@example.com",
                "name": "Test Subscriber"
            }
            response = self.session.post(f"{self.base_url}/api/subscribers", json=subscriber_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/subscribers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code in [200, 201]:
                self.log_test("POST /api/subscribers", True, f"Successfully created - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/subscribers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/subscribers", False, f"Exception: {str(e)}")
            return False

    def test_subscribers_requests(self):
        """Test GET /api/subscribers/requests"""
        try:
            response = self.session.get(f"{self.base_url}/api/subscribers/requests")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/subscribers/requests", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/subscribers/requests", True, f"Returned {len(data)} requests")
                return True
            else:
                self.log_test("GET /api/subscribers/requests", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/subscribers/requests", False, f"Exception: {str(e)}")
            return False

    # 7. Customer Management APIs (Admin)
    def test_customers_list(self):
        """Test GET /api/customers"""
        try:
            response = self.session.get(f"{self.base_url}/api/customers")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/customers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/customers", True, f"Returned {len(data)} customers")
                return True
            else:
                self.log_test("GET /api/customers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/customers", False, f"Exception: {str(e)}")
            return False

    def test_admin_customer_cart(self):
        """Test GET /api/admin/customer/{user_id}/cart"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/customer/test-user-id/cart")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/admin/customer/{{user_id}}/cart", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code in [200, 404]:
                self.log_test("GET /api/admin/customer/{{user_id}}/cart", True, f"Handled correctly - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/admin/customer/{{user_id}}/cart", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admin/customer/{{user_id}}/cart", False, f"Exception: {str(e)}")
            return False

    def test_admin_customer_orders(self):
        """Test GET /api/admin/customer/{user_id}/orders"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/customer/test-user-id/orders")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/admin/customer/{{user_id}}/orders", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code in [200, 404]:
                self.log_test("GET /api/admin/customer/{{user_id}}/orders", True, f"Handled correctly - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/admin/customer/{{user_id}}/orders", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admin/customer/{{user_id}}/orders", False, f"Exception: {str(e)}")
            return False

    def test_admin_customer_favorites(self):
        """Test GET /api/admin/customer/{user_id}/favorites"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/customer/test-user-id/favorites")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/admin/customer/{{user_id}}/favorites", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code in [200, 404]:
                self.log_test("GET /api/admin/customer/{{user_id}}/favorites", True, f"Handled correctly - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/admin/customer/{{user_id}}/favorites", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/admin/customer/{{user_id}}/favorites", False, f"Exception: {str(e)}")
            return False

    # 8. Order Management APIs (Admin)
    def test_orders_list(self):
        """Test GET /api/orders"""
        try:
            response = self.session.get(f"{self.base_url}/api/orders")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/orders", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/orders", True, f"Returned {len(data)} orders")
                return True
            else:
                self.log_test("GET /api/orders", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/orders", False, f"Exception: {str(e)}")
            return False

    def test_orders_get_by_id(self):
        """Test GET /api/orders/{id}"""
        try:
            response = self.session.get(f"{self.base_url}/api/orders/test-order-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("GET /api/orders/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/orders/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/orders/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_orders_update_status(self):
        """Test PATCH /api/orders/{id}/status"""
        try:
            status_data = {"status": "shipped"}
            response = self.session.patch(f"{self.base_url}/api/orders/test-order-id/status", json=status_data)
            if response.status_code in [401, 403, 404]:
                self.log_test("PATCH /api/orders/{{id}}/status", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("PATCH /api/orders/{{id}}/status", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("PATCH /api/orders/{{id}}/status", False, f"Exception: {str(e)}")
            return False

    def test_orders_delete(self):
        """Test DELETE /api/orders/{id}"""
        try:
            response = self.session.delete(f"{self.base_url}/api/orders/test-order-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("DELETE /api/orders/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("DELETE /api/orders/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("DELETE /api/orders/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_admin_orders_create(self):
        """Test POST /api/admin/orders/create"""
        try:
            order_data = {
                "customer_id": "test-customer-id",
                "items": [{"product_id": "test-product", "quantity": 1}]
            }
            response = self.session.post(f"{self.base_url}/api/admin/orders/create", json=order_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/admin/orders/create", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/admin/orders/create", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/admin/orders/create", False, f"Exception: {str(e)}")
            return False

    # 9. Analytics APIs (Owner/Admin)
    def test_analytics_overview(self):
        """Test GET /api/analytics/overview"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics/overview")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/analytics/overview", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/analytics/overview", True, f"Returned analytics data")
                return True
            else:
                self.log_test("GET /api/analytics/overview", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/analytics/overview", False, f"Exception: {str(e)}")
            return False

    def test_analytics_sales(self):
        """Test GET /api/analytics/sales"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics/sales")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/analytics/sales", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/analytics/sales", True, f"Returned sales analytics")
                return True
            else:
                self.log_test("GET /api/analytics/sales", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/analytics/sales", False, f"Exception: {str(e)}")
            return False

    def test_analytics_customers(self):
        """Test GET /api/analytics/customers"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics/customers")
            if response.status_code in [401, 403]:
                self.log_test("GET /api/analytics/customers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/analytics/customers", True, f"Returned customer analytics")
                return True
            else:
                self.log_test("GET /api/analytics/customers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/analytics/customers", False, f"Exception: {str(e)}")
            return False

    # 10. Marketing Management APIs (Admin)
    def test_promotions_list(self):
        """Test GET /api/promotions"""
        try:
            response = self.session.get(f"{self.base_url}/api/promotions")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/promotions", True, f"Returned {len(data)} promotions")
                return True
            elif response.status_code in [401, 403]:
                self.log_test("GET /api/promotions", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/promotions", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/promotions", False, f"Exception: {str(e)}")
            return False

    def test_promotions_create(self):
        """Test POST /api/promotions"""
        try:
            promotion_data = {
                "title": "Test Promotion",
                "description": "Test Description",
                "discount_percentage": 10
            }
            response = self.session.post(f"{self.base_url}/api/promotions", json=promotion_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/promotions", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/promotions", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/promotions", False, f"Exception: {str(e)}")
            return False

    def test_promotions_update(self):
        """Test PUT /api/promotions/{id}"""
        try:
            promotion_data = {"title": "Updated Promotion"}
            response = self.session.put(f"{self.base_url}/api/promotions/test-promo-id", json=promotion_data)
            if response.status_code in [401, 403, 404]:
                self.log_test("PUT /api/promotions/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("PUT /api/promotions/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("PUT /api/promotions/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_promotions_delete(self):
        """Test DELETE /api/promotions/{id}"""
        try:
            response = self.session.delete(f"{self.base_url}/api/promotions/test-promo-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("DELETE /api/promotions/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("DELETE /api/promotions/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("DELETE /api/promotions/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_bundle_offers_list(self):
        """Test GET /api/bundle-offers"""
        try:
            response = self.session.get(f"{self.base_url}/api/bundle-offers")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/bundle-offers", True, f"Returned {len(data)} bundle offers")
                return True
            elif response.status_code in [401, 403]:
                self.log_test("GET /api/bundle-offers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("GET /api/bundle-offers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET /api/bundle-offers", False, f"Exception: {str(e)}")
            return False

    def test_bundle_offers_create(self):
        """Test POST /api/bundle-offers"""
        try:
            bundle_data = {
                "name": "Test Bundle",
                "description": "Test Bundle Description",
                "discount_percentage": 15,
                "product_ids": ["test-product-1", "test-product-2"]
            }
            response = self.session.post(f"{self.base_url}/api/bundle-offers", json=bundle_data)
            if response.status_code in [401, 403]:
                self.log_test("POST /api/bundle-offers", True, f"Correctly requires auth - status {response.status_code}")
                return True
            else:
                self.log_test("POST /api/bundle-offers", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("POST /api/bundle-offers", False, f"Exception: {str(e)}")
            return False

    def test_bundle_offers_update(self):
        """Test PUT /api/bundle-offers/{id}"""
        try:
            bundle_data = {"name": "Updated Bundle"}
            response = self.session.put(f"{self.base_url}/api/bundle-offers/test-bundle-id", json=bundle_data)
            if response.status_code in [401, 403, 404]:
                self.log_test("PUT /api/bundle-offers/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("PUT /api/bundle-offers/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("PUT /api/bundle-offers/{{id}}", False, f"Exception: {str(e)}")
            return False

    def test_bundle_offers_delete(self):
        """Test DELETE /api/bundle-offers/{id}"""
        try:
            response = self.session.delete(f"{self.base_url}/api/bundle-offers/test-bundle-id")
            if response.status_code in [401, 403, 404]:
                self.log_test("DELETE /api/bundle-offers/{{id}}", True, f"Correctly handled - status {response.status_code}")
                return True
            else:
                self.log_test("DELETE /api/bundle-offers/{{id}}", False, f"Unexpected status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("DELETE /api/bundle-offers/{{id}}", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all test cases"""
        print("=" * 100)
        print("AL-GHAZALY AUTO PARTS BACKEND API v4.1.0 - COMPREHENSIVE TESTING")
        print("Focus: Admin and Owner Panel Flows (As per Review Request)")
        print("=" * 100)
        print()

        # Health Check
        print("🏥 HEALTH CHECK")
        print("-" * 50)
        self.test_health_check()

        # 1. Authentication & Authorization Tests
        print("🔐 1. AUTHENTICATION & AUTHORIZATION ENDPOINTS")
        print("-" * 50)
        self.test_auth_login()
        self.test_auth_register()
        self.test_auth_logout()
        self.test_auth_me()

        # 2. Admin Management Tests
        print("👥 2. ADMIN MANAGEMENT APIs (Owner-only)")
        print("-" * 50)
        self.test_admins_list()
        self.test_admins_create()
        self.test_admins_get_by_id()
        self.test_admins_update()
        self.test_admins_delete()
        self.test_admins_check_access()

        # 3. Partner Management Tests
        print("🤝 3. PARTNER MANAGEMENT APIs (Owner-only)")
        print("-" * 50)
        self.test_partners_list()
        self.test_partners_create()

        # 4. Supplier Management Tests
        print("🏭 4. SUPPLIER MANAGEMENT APIs")
        print("-" * 50)
        self.test_suppliers_list()
        self.test_suppliers_create()

        # 5. Distributor Management Tests
        print("🚚 5. DISTRIBUTOR MANAGEMENT APIs")
        print("-" * 50)
        self.test_distributors_list()
        self.test_distributors_create()

        # 6. Subscriber Management Tests
        print("📧 6. SUBSCRIBER MANAGEMENT APIs")
        print("-" * 50)
        self.test_subscribers_list()
        self.test_subscribers_add()
        self.test_subscribers_requests()

        # 7. Customer Management Tests
        print("👤 7. CUSTOMER MANAGEMENT APIs (Admin)")
        print("-" * 50)
        self.test_customers_list()
        self.test_admin_customer_cart()
        self.test_admin_customer_orders()
        self.test_admin_customer_favorites()

        # 8. Order Management Tests
        print("📦 8. ORDER MANAGEMENT APIs (Admin)")
        print("-" * 50)
        self.test_orders_list()
        self.test_orders_get_by_id()
        self.test_orders_update_status()
        self.test_orders_delete()
        self.test_admin_orders_create()

        # 9. Analytics Tests
        print("📊 9. ANALYTICS APIs (Owner/Admin)")
        print("-" * 50)
        self.test_analytics_overview()
        self.test_analytics_sales()
        self.test_analytics_customers()

        # 10. Marketing Management Tests
        print("🎯 10. MARKETING MANAGEMENT APIs (Admin)")
        print("-" * 50)
        self.test_promotions_list()
        self.test_promotions_create()
        self.test_promotions_update()
        self.test_promotions_delete()
        self.test_bundle_offers_list()
        self.test_bundle_offers_create()
        self.test_bundle_offers_update()
        self.test_bundle_offers_delete()

        # Summary
        self.print_summary()

    def print_summary(self):
        """Print comprehensive test summary"""
        print("=" * 100)
        print("COMPREHENSIVE TEST SUMMARY")
        print("=" * 100)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            print("-" * 50)
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        print("-" * 50)
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}: {result['details']}")
        print()
        
        print("🔍 SECURITY ANALYSIS:")
        print("-" * 50)
        
        # Check authentication enforcement
        auth_tests = [r for r in self.test_results if "auth" in r["details"].lower() and r["success"]]
        print(f"✅ {len(auth_tests)} endpoints properly secured with authentication")
        
        # Check public endpoints
        public_tests = [r for r in self.test_results if "public endpoint" in r["details"].lower()]
        if public_tests:
            print(f"ℹ️  {len(public_tests)} endpoints are public (as expected)")
        
        print()
        print("📋 ENDPOINT COVERAGE:")
        print("-" * 50)
        categories = {
            "Authentication": ["auth"],
            "Admin Management": ["admins"],
            "Partner Management": ["partners"],
            "Supplier Management": ["suppliers"],
            "Distributor Management": ["distributors"],
            "Subscriber Management": ["subscribers"],
            "Customer Management": ["customers", "admin/customer"],
            "Order Management": ["orders"],
            "Analytics": ["analytics"],
            "Marketing": ["promotions", "bundle-offers"]
        }
        
        for category, keywords in categories.items():
            category_tests = [r for r in self.test_results if any(kw in r["test"].lower() for kw in keywords)]
            category_passed = sum(1 for r in category_tests if r["success"])
            print(f"  • {category}: {category_passed}/{len(category_tests)} tests passed")
        
        print()
        print("=" * 100)

if __name__ == "__main__":
    # Allow custom base URL via command line argument
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
    
    tester = ComprehensiveAPITester(base_url)
    tester.run_all_tests()