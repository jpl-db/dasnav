#!/usr/bin/env python3
"""
End-to-end tests for the Databricks Query API
Tests both direct API calls and simulated frontend calls
"""

import requests
import json
import sys
import time

# API endpoints
BACKEND_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:8080"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, status, message=""):
    symbol = f"{Colors.GREEN}✅{Colors.END}" if status else f"{Colors.RED}❌{Colors.END}"
    print(f"{symbol} {name}")
    if message:
        print(f"   {message}")

def test_backend_health():
    """Test 1: Backend health check returns valid JSON"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        
        # Check status code
        if response.status_code != 200:
            print_test("Backend Health Check", False, f"Status code: {response.status_code}")
            return False
        
        # Check Content-Type header
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            print_test("Backend Health Check", False, f"Wrong Content-Type: {content_type}")
            return False
        
        # Try to parse JSON
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print_test("Backend Health Check", False, f"Invalid JSON: {str(e)}")
            print(f"   Response text: {response.text[:200]}")
            return False
        
        # Validate response structure
        if data.get('status') != 'ok':
            print_test("Backend Health Check", False, f"Invalid status: {data.get('status')}")
            return False
        
        print_test("Backend Health Check", True, f"Profile: {data.get('profile')}")
        return True
        
    except requests.exceptions.ConnectionError:
        print_test("Backend Health Check", False, "Backend not running on port 8001")
        return False
    except Exception as e:
        print_test("Backend Health Check", False, str(e))
        return False


def test_schema_fetch_returns_json():
    """Test 2: Schema fetch returns valid JSON (not HTML)"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/schema/samples.nyctaxi.trips",
            timeout=10
        )
        
        # Critical: Check Content-Type FIRST
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            print_test("Schema Fetch JSON", False, f"Wrong Content-Type: {content_type}")
            print(f"   Response starts with: {response.text[:100]}")
            return False
        
        # Check for HTML in response (common error)
        if response.text.strip().startswith('<!DOCTYPE') or response.text.strip().startswith('<html'):
            print_test("Schema Fetch JSON", False, "Response is HTML, not JSON!")
            print(f"   Response: {response.text[:200]}")
            return False
        
        # Try to parse JSON
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print_test("Schema Fetch JSON", False, f"Invalid JSON: {str(e)}")
            print(f"   Response text: {response.text[:200]}")
            return False
        
        # Validate structure
        if 'schema' not in data:
            print_test("Schema Fetch JSON", False, "Missing 'schema' field in response")
            return False
        
        if not isinstance(data['schema'], list):
            print_test("Schema Fetch JSON", False, f"Schema is not a list: {type(data['schema'])}")
            return False
        
        print_test("Schema Fetch JSON", True, f"Found {len(data['schema'])} columns")
        return True
        
    except Exception as e:
        print_test("Schema Fetch JSON", False, str(e))
        return False


def test_cors_headers():
    """Test 3: CORS headers are present for frontend"""
    try:
        # Make a request from the frontend's perspective
        response = requests.get(
            f"{BACKEND_URL}/api/health",
            headers={'Origin': FRONTEND_URL},
            timeout=5
        )
        
        # Check for CORS headers
        cors_header = response.headers.get('Access-Control-Allow-Origin')
        if not cors_header:
            print_test("CORS Headers", False, "Missing Access-Control-Allow-Origin header")
            return False
        
        if cors_header != '*' and FRONTEND_URL not in cors_header:
            print_test("CORS Headers", False, f"CORS header doesn't include {FRONTEND_URL}: {cors_header}")
            return False
        
        print_test("CORS Headers", True, f"CORS: {cors_header}")
        return True
        
    except Exception as e:
        print_test("CORS Headers", False, str(e))
        return False


def test_frontend_can_reach_api():
    """Test 4: Frontend can reach backend API (simulated)"""
    try:
        # Simulate a fetch from the frontend
        response = requests.get(
            f"{BACKEND_URL}/api/schema/samples.nyctaxi.trips",
            headers={
                'Origin': FRONTEND_URL,
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        # This is what the frontend expects
        if response.status_code != 200:
            print_test("Frontend API Access", False, f"Status: {response.status_code}")
            return False
        
        # Check Content-Type
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            print_test("Frontend API Access", False, f"Expected JSON, got: {content_type}")
            return False
        
        # Try to parse as JSON (this is what caused the error in the UI)
        try:
            data = response.json()
        except json.JSONDecodeError:
            print_test("Frontend API Access", False, "Frontend would get: 'Unexpected token'")
            print(f"   Response: {response.text[:200]}")
            return False
        
        # Check structure matches what frontend expects
        if 'schema' in data and isinstance(data['schema'], list):
            print_test("Frontend API Access", True, "Frontend can parse schema response")
            return True
        else:
            print_test("Frontend API Access", False, "Response structure doesn't match frontend expectations")
            return False
        
    except Exception as e:
        print_test("Frontend API Access", False, str(e))
        return False


def test_query_execution_json():
    """Test 5: Query execution returns valid JSON"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/query",
            json={"query": "SELECT * FROM samples.nyctaxi.trips LIMIT 2"},
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        # Check Content-Type
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            print_test("Query Execution JSON", False, f"Wrong Content-Type: {content_type}")
            return False
        
        # Parse JSON
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print_test("Query Execution JSON", False, f"Invalid JSON: {str(e)}")
            return False
        
        # Validate structure
        if data.get('status') != 'success':
            print_test("Query Execution JSON", False, f"Query failed: {data.get('message')}")
            return False
        
        if 'data' not in data:
            print_test("Query Execution JSON", False, "Missing 'data' field")
            return False
        
        print_test("Query Execution JSON", True, f"Returned {data.get('row_count', 0)} rows")
        return True
        
    except Exception as e:
        print_test("Query Execution JSON", False, str(e))
        return False


def test_error_handling_returns_json():
    """Test 6: Error responses also return JSON (not HTML)"""
    try:
        # Try to fetch schema for non-existent table
        response = requests.get(
            f"{BACKEND_URL}/api/schema/nonexistent.table.name",
            timeout=10
        )
        
        # Even errors should return JSON
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            print_test("Error Response JSON", False, f"Error returned HTML, not JSON: {content_type}")
            return False
        
        # Parse JSON
        try:
            data = response.json()
        except json.JSONDecodeError:
            print_test("Error Response JSON", False, "Error response is not valid JSON")
            return False
        
        # Validate error structure
        if data.get('status') != 'error':
            print_test("Error Response JSON", False, "Error response missing 'error' status")
            return False
        
        print_test("Error Response JSON", True, "Errors return valid JSON")
        return True
        
    except Exception as e:
        print_test("Error Response JSON", False, str(e))
        return False


def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}🧪 END-TO-END API TESTS{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    print(f"{Colors.YELLOW}Testing Backend: {BACKEND_URL}{Colors.END}")
    print(f"{Colors.YELLOW}Frontend Origin: {FRONTEND_URL}{Colors.END}\n")
    
    # Run all tests
    results = []
    results.append(("Backend Health", test_backend_health()))
    results.append(("Schema Fetch JSON", test_schema_fetch_returns_json()))
    results.append(("CORS Headers", test_cors_headers()))
    results.append(("Frontend API Access", test_frontend_can_reach_api()))
    results.append(("Query Execution JSON", test_query_execution_json()))
    results.append(("Error Handling JSON", test_error_handling_returns_json()))
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {status}  {name}")
    
    print(f"\n{Colors.BLUE}Passed: {passed}/{total}{Colors.END}\n")
    
    if passed == total:
        print(f"{Colors.GREEN}✅ ALL TESTS PASSED!{Colors.END}\n")
        return 0
    else:
        print(f"{Colors.RED}❌ SOME TESTS FAILED!{Colors.END}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
