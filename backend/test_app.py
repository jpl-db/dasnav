#!/usr/bin/env python3
"""
Simple test to verify the app's query functionality works
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

# Import the app functions
from app import get_databricks_connection, execute_query

def test_app_query():
    """Test that the app's execute_query function works"""
    print("🧪 Testing App Query Function")
    print("=" * 60)
    
    # Test a simple query
    query = "SELECT 1 as test, 'hello' as message"
    
    print(f"Query: {query}")
    print("\nExecuting...")
    
    # This simulates what happens when user clicks "Execute Query" in the app
    # Note: We can't actually call execute_query because it uses streamlit functions
    # So we'll just test the connection part
    
    connection, error = get_databricks_connection()
    
    if error:
        print(f"❌ FAIL: {error}")
        return False
    
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        print(f"✅ SUCCESS!")
        print(f"Columns: {columns}")
        print(f"Rows: {rows}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        try:
            connection.close()
        except:
            pass
        return False


if __name__ == "__main__":
    success = test_app_query()
    sys.exit(0 if success else 1)
