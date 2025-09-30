#!/usr/bin/env python3
"""
Test the Flask API endpoints
"""

import requests
import json

API_BASE = "http://localhost:8001"

def test_health():
    """Test health check endpoint"""
    print("🧪 Testing Health Check...")
    response = requests.get(f"{API_BASE}/api/health")
    data = response.json()
    
    if response.status_code == 200:
        print(f"✅ Health check passed")
        print(f"   Status: {data['status']}")
        print(f"   Profile: {data['profile']}")
        return True
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False


def test_connection():
    """Test database connection endpoint"""
    print("\n🧪 Testing Database Connection...")
    response = requests.get(f"{API_BASE}/api/test-connection")
    data = response.json()
    
    if response.status_code == 200 and data['status'] == 'success':
        print(f"✅ Database connection successful")
        print(f"   Message: {data['message']}")
        return True
    else:
        print(f"❌ Database connection failed")
        print(f"   Message: {data.get('message', 'Unknown error')}")
        return False


def test_query():
    """Test query endpoint"""
    print("\n🧪 Testing Query Execution...")
    
    query_data = {
        "query": "SELECT 1 as test, 'hello' as message"
    }
    
    response = requests.post(
        f"{API_BASE}/api/query",
        json=query_data,
        headers={'Content-Type': 'application/json'}
    )
    
    data = response.json()
    
    if response.status_code == 200 and data['status'] == 'success':
        print(f"✅ Query executed successfully")
        print(f"   Rows returned: {data['row_count']}")
        print(f"   Columns: {data['columns']}")
        print(f"   Data: {data['data']}")
        return True
    else:
        print(f"❌ Query failed")
        print(f"   Message: {data.get('message', 'Unknown error')}")
        return False


def test_nyctaxi_query():
    """Test query with NYC taxi sample data"""
    print("\n🧪 Testing NYC Taxi Query...")
    
    query_data = {
        "query": "SELECT * FROM samples.nyctaxi.trips LIMIT 5"
    }
    
    response = requests.post(
        f"{API_BASE}/api/query",
        json=query_data,
        headers={'Content-Type': 'application/json'}
    )
    
    data = response.json()
    
    if response.status_code == 200 and data['status'] == 'success':
        print(f"✅ NYC Taxi query successful")
        print(f"   Rows returned: {data['row_count']}")
        print(f"   Columns: {', '.join(data['columns'][:5])}...")
        return True
    else:
        print(f"❌ NYC Taxi query failed")
        print(f"   Message: {data.get('message', 'Unknown error')}")
        return False


def main():
    print("=" * 60)
    print("🔍 DATABRICKS API TEST SUITE")
    print("=" * 60)
    print(f"\nTesting API at: {API_BASE}")
    print("")
    
    results = []
    
    try:
        results.append(test_health())
        results.append(test_connection())
        results.append(test_query())
        results.append(test_nyctaxi_query())
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to API server")
        print("   Make sure the backend is running:")
        print("   cd backend && python api.py")
        return
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ ALL API TESTS PASSED!")
    else:
        print(f"❌ {total - passed} TEST(S) FAILED")
    
    print("")


if __name__ == "__main__":
    main()
