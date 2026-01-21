#!/usr/bin/env python3
"""
Admin and Owner Panel Backend API Testing for Al-Ghazaly Auto Parts API
Comprehensive testing of all admin and owner panel backend APIs including CRUD operations.
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Test Configuration
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

class AdminOwnerPanelTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_items = {
            'car_brands': [],
            'car_models': [],
            'categories': [],
            'product_brands': [],
            'suppliers': [],
            'distributors': []
        }
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        try:
            if headers is None:
                headers = {}
            
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = await response.json() if response_text else {}
                    except:
                        response_data = {"raw_response": response_text}
                    return {
                        "status": response.status,
                        "data": response_data,
                        "headers": dict(response.headers)
                    }
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = await response.json() if response_text else {}
                    except:
                        response_data = {"raw_response": response_text}
                    return {
                        "status": response.status,
                        "data": response_data,
                        "headers": dict(response.headers)
                    }
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = await response.json() if response_text else {}
                    except:
                        response_data = {"raw_response": response_text}
                    return {
                        "status": response.status,
                        "data": response_data,
                        "headers": dict(response.headers)
                    }
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = await response.json() if response_text else {}
                    except:
                        response_data = {"raw_response": response_text}
                    return {
                        "status": response.status,
                        "data": response_data,
                        "headers": dict(response.headers)
                    }
        except Exception as e:
            return {
                "status": 0,
                "data": {"error": str(e)},
                "headers": {}
            }
    
    async def test_api_health(self):
        """Test basic API health and connectivity"""
        print("\n=== Testing API Health ===")
        
        # Test root endpoint
        try:
            async with self.session.get(f"{BASE_URL}/") as resp:
                root_data = await resp.json()
                self.log_result(
                    "Root Endpoint Connectivity", 
                    resp.status == 200,
                    f"Status: {resp.status}, Version: {root_data.get('version', 'N/A')}",
                    root_data
                )
        except Exception as e:
            self.log_result("Root Endpoint Connectivity", False, f"Error: {str(e)}")
        
        # Test health endpoint
        response = await self.make_request("GET", "/health")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success:
            health_data = response["data"]
            details += f", API Version: {health_data.get('api_version', 'N/A')}, DB: {health_data.get('database', 'N/A')}"
        
        self.log_result("Health Check Endpoint", success, details, response["data"])
    
    async def test_car_brands_api(self):
        """Test Car Brands API endpoints"""
        print("\n=== Testing Car Brands API ===")
        
        # Test GET /api/car-brands
        response = await self.make_request("GET", "/car-brands")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            brand_count = len(response["data"])
            details += f", Car brands found: {brand_count}"
        
        self.log_result("GET Car Brands", success, details)
        
        # Test POST /api/car-brands
        brand_data = {
            "name": "Test Brand",
            "name_ar": "ماركة تجريبية"
        }
        
        response = await self.make_request("POST", "/car-brands", brand_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            brand_id = response["data"]["id"]
            self.created_items['car_brands'].append(brand_id)
            details += f", Created brand ID: {brand_id}"
        
        self.log_result("POST Car Brand", success, details, response["data"])
        
        # Test PUT /api/car-brands/{id} if we have a created brand
        if self.created_items['car_brands']:
            brand_id = self.created_items['car_brands'][0]
            update_data = {
                "name": "Updated Test Brand",
                "name_ar": "ماركة تجريبية محدثة"
            }
            
            response = await self.make_request("PUT", f"/car-brands/{brand_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Car Brand", success, details, response["data"])
        
        # Test DELETE /api/car-brands/{id} if we have a created brand
        if self.created_items['car_brands']:
            brand_id = self.created_items['car_brands'][0]
            
            response = await self.make_request("DELETE", f"/car-brands/{brand_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Car Brand", success, details, response["data"])
    
    async def test_car_models_api(self):
        """Test Car Models API endpoints"""
        print("\n=== Testing Car Models API ===")
        
        # Test GET /api/car-models
        response = await self.make_request("GET", "/car-models")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            model_count = len(response["data"])
            details += f", Car models found: {model_count}"
        
        self.log_result("GET Car Models", success, details)
        
        # Test POST /api/car-models
        model_data = {
            "name": "Test Model",
            "name_ar": "موديل تجريبي",
            "car_brand_id": "test_brand_id",
            "year": 2024
        }
        
        response = await self.make_request("POST", "/car-models", model_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            model_id = response["data"]["id"]
            self.created_items['car_models'].append(model_id)
            details += f", Created model ID: {model_id}"
        
        self.log_result("POST Car Model", success, details, response["data"])
        
        # Test PUT /api/car-models/{id} if we have a created model
        if self.created_items['car_models']:
            model_id = self.created_items['car_models'][0]
            update_data = {
                "name": "Updated Test Model",
                "name_ar": "موديل تجريبي محدث",
                "year": 2025
            }
            
            response = await self.make_request("PUT", f"/car-models/{model_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Car Model", success, details, response["data"])
        
        # Test DELETE /api/car-models/{id} if we have a created model
        if self.created_items['car_models']:
            model_id = self.created_items['car_models'][0]
            
            response = await self.make_request("DELETE", f"/car-models/{model_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Car Model", success, details, response["data"])
    
    async def test_categories_api(self):
        """Test Categories API endpoints"""
        print("\n=== Testing Categories API ===")
        
        # Test GET /api/categories
        response = await self.make_request("GET", "/categories")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            category_count = len(response["data"])
            details += f", Categories found: {category_count}"
        
        self.log_result("GET Categories", success, details)
        
        # Also test GET /api/categories/all (alternative endpoint)
        response = await self.make_request("GET", "/categories/all")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            category_count = len(response["data"])
            details += f", Categories found: {category_count}"
        
        self.log_result("GET Categories (All)", success, details)
        
        # Test POST /api/categories
        category_data = {
            "name": "Test Category",
            "name_ar": "فئة تجريبية",
            "description": "Test category description",
            "description_ar": "وصف الفئة التجريبية"
        }
        
        response = await self.make_request("POST", "/categories", category_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            category_id = response["data"]["id"]
            self.created_items['categories'].append(category_id)
            details += f", Created category ID: {category_id}"
        
        self.log_result("POST Category", success, details, response["data"])
        
        # Test PUT /api/categories/{id} if we have a created category
        if self.created_items['categories']:
            category_id = self.created_items['categories'][0]
            update_data = {
                "name": "Updated Test Category",
                "name_ar": "فئة تجريبية محدثة",
                "description": "Updated test category description"
            }
            
            response = await self.make_request("PUT", f"/categories/{category_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Category", success, details, response["data"])
        
        # Test DELETE /api/categories/{id} if we have a created category
        if self.created_items['categories']:
            category_id = self.created_items['categories'][0]
            
            response = await self.make_request("DELETE", f"/categories/{category_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Category", success, details, response["data"])
    
    async def test_product_brands_api(self):
        """Test Product Brands API endpoints"""
        print("\n=== Testing Product Brands API ===")
        
        # Test GET /api/product-brands
        response = await self.make_request("GET", "/product-brands")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            brand_count = len(response["data"])
            details += f", Product brands found: {brand_count}"
        
        self.log_result("GET Product Brands", success, details)
        
        # Test POST /api/product-brands
        brand_data = {
            "name": "Test Product Brand",
            "name_ar": "علامة منتج تجريبية",
            "country": "Test Country",
            "country_ar": "بلد تجريبي"
        }
        
        response = await self.make_request("POST", "/product-brands", brand_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            brand_id = response["data"]["id"]
            self.created_items['product_brands'].append(brand_id)
            details += f", Created product brand ID: {brand_id}"
        
        self.log_result("POST Product Brand", success, details, response["data"])
        
        # Test PUT /api/product-brands/{id} if we have a created brand
        if self.created_items['product_brands']:
            brand_id = self.created_items['product_brands'][0]
            update_data = {
                "name": "Updated Test Product Brand",
                "name_ar": "علامة منتج تجريبية محدثة",
                "country": "Updated Test Country"
            }
            
            response = await self.make_request("PUT", f"/product-brands/{brand_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Product Brand", success, details, response["data"])
        
        # Test DELETE /api/product-brands/{id} if we have a created brand
        if self.created_items['product_brands']:
            brand_id = self.created_items['product_brands'][0]
            
            response = await self.make_request("DELETE", f"/product-brands/{brand_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Product Brand", success, details, response["data"])
    
    async def test_orders_api(self):
        """Test Orders API endpoints"""
        print("\n=== Testing Orders API ===")
        
        # Test GET /api/orders
        response = await self.make_request("GET", "/orders")
        success = response["status"] in [200, 401]  # May require auth
        details = f"Status: {response['status']}"
        if response["status"] == 200 and "orders" in response["data"]:
            order_count = len(response["data"]["orders"])
            details += f", Orders found: {order_count}"
        elif response["status"] == 401:
            details += " (Authentication required as expected)"
        
        self.log_result("GET Orders", success, details)
        
        # Test GET /api/orders/admin
        response = await self.make_request("GET", "/orders/admin")
        success = response["status"] in [200, 401, 403]  # May require admin auth
        details = f"Status: {response['status']}"
        if response["status"] == 200 and isinstance(response["data"], list):
            order_count = len(response["data"])
            details += f", Admin orders found: {order_count}"
        elif response["status"] in [401, 403]:
            details += " (Admin authentication required as expected)"
        
        self.log_result("GET Admin Orders", success, details)
        
        # Test PUT /api/orders/{id}/status
        test_order_id = "test_order_123"
        response = await self.make_request("PUT", f"/orders/{test_order_id}/status", {"status": "preparing"})
        success = response["status"] in [200, 401, 403, 404]  # Various expected responses
        details = f"Status: {response['status']}"
        if response["status"] in [401, 403]:
            details += " (Authentication required as expected)"
        elif response["status"] == 404:
            details += " (Order not found as expected)"
        
        self.log_result("PUT Order Status", success, details, response["data"])
    
    async def test_customers_api(self):
        """Test Customers API endpoints"""
        print("\n=== Testing Customers API ===")
        
        # Test GET /api/customers
        response = await self.make_request("GET", "/customers")
        success = response["status"] in [200, 401]  # May require auth
        details = f"Status: {response['status']}"
        if response["status"] == 200 and isinstance(response["data"], list):
            customer_count = len(response["data"])
            details += f", Customers found: {customer_count}"
        elif response["status"] == 401:
            details += " (Authentication required as expected)"
        
        self.log_result("GET Customers", success, details)
    
    async def test_suppliers_api(self):
        """Test Suppliers API endpoints"""
        print("\n=== Testing Suppliers API ===")
        
        # Test GET /api/suppliers
        response = await self.make_request("GET", "/suppliers")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            supplier_count = len(response["data"])
            details += f", Suppliers found: {supplier_count}"
        
        self.log_result("GET Suppliers", success, details)
        
        # Test POST /api/suppliers
        supplier_data = {
            "name": "Test Supplier",
            "name_ar": "مورد تجريبي",
            "email": "test@supplier.com",
            "phone": "+1234567890",
            "address": "Test Address",
            "address_ar": "عنوان تجريبي"
        }
        
        response = await self.make_request("POST", "/suppliers", supplier_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            supplier_id = response["data"]["id"]
            self.created_items['suppliers'].append(supplier_id)
            details += f", Created supplier ID: {supplier_id}"
        
        self.log_result("POST Supplier", success, details, response["data"])
        
        # Test PUT /api/suppliers/{id} if we have a created supplier
        if self.created_items['suppliers']:
            supplier_id = self.created_items['suppliers'][0]
            update_data = {
                "name": "Updated Test Supplier",
                "name_ar": "مورد تجريبي محدث",
                "email": "updated@supplier.com"
            }
            
            response = await self.make_request("PUT", f"/suppliers/{supplier_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Supplier", success, details, response["data"])
        
        # Test DELETE /api/suppliers/{id} if we have a created supplier
        if self.created_items['suppliers']:
            supplier_id = self.created_items['suppliers'][0]
            
            response = await self.make_request("DELETE", f"/suppliers/{supplier_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Supplier", success, details, response["data"])
    
    async def test_distributors_api(self):
        """Test Distributors API endpoints"""
        print("\n=== Testing Distributors API ===")
        
        # Test GET /api/distributors
        response = await self.make_request("GET", "/distributors")
        success = response["status"] == 200
        details = f"Status: {response['status']}"
        if success and isinstance(response["data"], list):
            distributor_count = len(response["data"])
            details += f", Distributors found: {distributor_count}"
        
        self.log_result("GET Distributors", success, details)
        
        # Test POST /api/distributors
        distributor_data = {
            "name": "Test Distributor",
            "name_ar": "موزع تجريبي",
            "email": "test@distributor.com",
            "phone": "+1234567890",
            "address": "Test Address",
            "address_ar": "عنوان تجريبي"
        }
        
        response = await self.make_request("POST", "/distributors", distributor_data)
        success = response["status"] in [200, 201]
        details = f"Status: {response['status']}"
        if success and "id" in response["data"]:
            distributor_id = response["data"]["id"]
            self.created_items['distributors'].append(distributor_id)
            details += f", Created distributor ID: {distributor_id}"
        
        self.log_result("POST Distributor", success, details, response["data"])
        
        # Test PUT /api/distributors/{id} if we have a created distributor
        if self.created_items['distributors']:
            distributor_id = self.created_items['distributors'][0]
            update_data = {
                "name": "Updated Test Distributor",
                "name_ar": "موزع تجريبي محدث",
                "email": "updated@distributor.com"
            }
            
            response = await self.make_request("PUT", f"/distributors/{distributor_id}", update_data)
            success = response["status"] == 200
            details = f"Status: {response['status']}"
            
            self.log_result("PUT Distributor", success, details, response["data"])
        
        # Test DELETE /api/distributors/{id} if we have a created distributor
        if self.created_items['distributors']:
            distributor_id = self.created_items['distributors'][0]
            
            response = await self.make_request("DELETE", f"/distributors/{distributor_id}")
            success = response["status"] in [200, 204]
            details = f"Status: {response['status']}"
            
            self.log_result("DELETE Distributor", success, details, response["data"])
    
    async def run_all_tests(self):
        """Run all admin and owner panel API tests"""
        print("🚀 Starting Admin and Owner Panel Backend API Testing for Al-Ghazaly Auto Parts")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Run all test suites
            await self.test_api_health()
            await self.test_car_brands_api()
            await self.test_car_models_api()
            await self.test_categories_api()
            await self.test_product_brands_api()
            await self.test_orders_api()
            await self.test_customers_api()
            await self.test_suppliers_api()
            await self.test_distributors_api()
            
        finally:
            await self.cleanup_session()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 ADMIN AND OWNER PANEL API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        print("\n" + "=" * 80)
        print("🎯 ADMIN AND OWNER PANEL API ENDPOINTS TESTED:")
        print("✅ Car Brands API (GET, POST, PUT, DELETE)")
        print("✅ Car Models API (GET, POST, PUT, DELETE)")
        print("✅ Categories API (GET, POST, PUT, DELETE)")
        print("✅ Product Brands API (GET, POST, PUT, DELETE)")
        print("✅ Orders API (GET, GET /admin, PUT /status)")
        print("✅ Customers API (GET)")
        print("✅ Suppliers API (GET, POST, PUT, DELETE)")
        print("✅ Distributors API (GET, POST, PUT, DELETE)")
        
        # Overall assessment
        if success_rate >= 80:
            print(f"\n🎉 OVERALL ASSESSMENT: EXCELLENT ({success_rate:.1f}% success rate)")
            print("The admin and owner panel APIs are working well!")
        elif success_rate >= 60:
            print(f"\n⚠️  OVERALL ASSESSMENT: GOOD ({success_rate:.1f}% success rate)")
            print("The admin and owner panel APIs are mostly functional with some issues.")
        else:
            print(f"\n🚨 OVERALL ASSESSMENT: NEEDS ATTENTION ({success_rate:.1f}% success rate)")
            print("The admin and owner panel APIs have significant issues that need to be addressed.")

async def main():
    """Main test execution"""
    tester = AdminOwnerPanelTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())