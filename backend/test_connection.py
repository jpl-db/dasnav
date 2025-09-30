#!/usr/bin/env python3
"""
Test script to verify Databricks connection and SQL queries
"""

import os
from dotenv import load_dotenv
from databricks import sql
from databricks.sdk import WorkspaceClient

# Load environment variables
load_dotenv()

DATABRICKS_PROFILE = os.getenv("DATABRICKS_PROFILE", "pm-bootcamp")
SQL_WAREHOUSE_ID = os.getenv("DATABRICKS_SQL_WAREHOUSE_ID", "")

def test_environment_variables():
    """Test that required environment variables are set"""
    print("=" * 60)
    print("TEST 1: Environment Variables")
    print("=" * 60)
    
    print(f"DATABRICKS_PROFILE: {DATABRICKS_PROFILE}")
    print(f"SQL_WAREHOUSE_ID: {SQL_WAREHOUSE_ID}")
    
    if not SQL_WAREHOUSE_ID:
        print("❌ FAIL: DATABRICKS_SQL_WAREHOUSE_ID not set")
        return False
    
    print("✅ PASS: Environment variables are configured")
    return True


def test_workspace_client():
    """Test that we can create a WorkspaceClient"""
    print("\n" + "=" * 60)
    print("TEST 2: Workspace Client Connection")
    print("=" * 60)
    
    try:
        w = WorkspaceClient(profile=DATABRICKS_PROFILE)
        print(f"✅ PASS: Connected to workspace: {w.config.host}")
        return True, w
    except Exception as e:
        print(f"❌ FAIL: Could not create WorkspaceClient: {str(e)}")
        return False, None


def test_sql_connection(w):
    """Test SQL connection"""
    print("\n" + "=" * 60)
    print("TEST 3: SQL Connection")
    print("=" * 60)
    
    try:
        from databricks.sdk.core import Config
        cfg = Config(profile=DATABRICKS_PROFILE)
        
        # Get authentication token
        auth_dict = cfg.authenticate()
        token = auth_dict.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            print("❌ FAIL: Could not extract token from authentication")
            return False, None
        
        connection = sql.connect(
            server_hostname=cfg.host.replace("https://", ""),
            http_path=f"/sql/1.0/warehouses/{SQL_WAREHOUSE_ID}",
            access_token=token
        )
        print("✅ PASS: SQL connection established")
        return True, connection
    except Exception as e:
        print(f"❌ FAIL: Could not establish SQL connection: {str(e)}")
        return False, None


def test_simple_query(connection):
    """Test a simple SQL query"""
    print("\n" + "=" * 60)
    print("TEST 4: Simple Query (SELECT 1)")
    print("=" * 60)
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        cursor.close()
        
        if result and result[0] == 1:
            print(f"✅ PASS: Query returned: {result}")
            return True
        else:
            print(f"❌ FAIL: Unexpected result: {result}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Query failed: {str(e)}")
        return False


def test_samples_table_query(connection):
    """Test querying the samples.nyctaxi.trips table"""
    print("\n" + "=" * 60)
    print("TEST 5: Query samples.nyctaxi.trips")
    print("=" * 60)
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM samples.nyctaxi.trips LIMIT 5")
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        cursor.close()
        
        print(f"✅ PASS: Retrieved {len(rows)} rows with {len(columns)} columns")
        print(f"Columns: {', '.join(columns[:5])}...")
        if rows:
            print(f"First row sample: {rows[0][:3]}...")
        return True
    except Exception as e:
        print(f"❌ FAIL: Query failed: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("\n" + "🔍 DATABRICKS CONNECTION TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Environment variables
    results.append(test_environment_variables())
    
    if not results[0]:
        print("\n❌ TESTS FAILED: Fix environment variables before continuing")
        return
    
    # Test 2: Workspace client
    success, w = test_workspace_client()
    results.append(success)
    
    if not success:
        print("\n❌ TESTS FAILED: Could not connect to workspace")
        return
    
    # Test 3: SQL connection
    success, connection = test_sql_connection(w)
    results.append(success)
    
    if not success:
        print("\n❌ TESTS FAILED: Could not establish SQL connection")
        return
    
    # Test 4: Simple query
    results.append(test_simple_query(connection))
    
    # Test 5: Sample table query
    results.append(test_samples_table_query(connection))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ ALL TESTS PASSED!")
    else:
        print(f"❌ {total - passed} TEST(S) FAILED")
    
    print("\n")


if __name__ == "__main__":
    main()
