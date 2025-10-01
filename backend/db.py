"""
Databricks SQL connection and query utilities
Reusable module for database operations
"""

import os
from dotenv import load_dotenv
from databricks import sql
from databricks.sdk.core import Config
import pandas as pd

# Load environment variables
load_dotenv()

# Configuration
# Profile is only used for local dev - deployed apps use service principal auth
DATABRICKS_PROFILE = os.getenv("DATABRICKS_PROFILE", "")  # Empty string means use default auth
SQL_WAREHOUSE_ID = os.getenv("DATABRICKS_SQL_WAREHOUSE_ID", "")


def get_databricks_connection():
    """
    Get Databricks SQL connection
    
    Uses profile-based auth for local dev, service principal for deployed apps.
    
    Returns:
        tuple: (connection, error_message)
        - connection: SQL connection object if successful, None otherwise
        - error_message: None if successful, error string otherwise
    """
    try:
        # Get warehouse ID from environment
        warehouse_id = SQL_WAREHOUSE_ID
        if not warehouse_id:
            return None, "Please set DATABRICKS_SQL_WAREHOUSE_ID environment variable"
        
        # Initialize config - will use profile for local dev, service principal when deployed
        if DATABRICKS_PROFILE:
            # Local development: use profile from .env
            cfg = Config(profile=DATABRICKS_PROFILE)
        else:
            # Deployed in Databricks Apps: use default auth (service principal)
            cfg = Config()
        
        # Get the OAuth token from the config
        # cfg.authenticate() returns {'Authorization': 'Bearer <token>'}
        auth_dict = cfg.authenticate()
        
        # Extract the Bearer token from the Authorization header
        token = auth_dict.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return None, "Could not get authentication token"
        
        # Create SQL connection using the access token
        connection = sql.connect(
            server_hostname=cfg.host.replace("https://", ""),
            http_path=f"/sql/1.0/warehouses/{warehouse_id}",
            access_token=token
        )
        
        return connection, None
    except Exception as e:
        env_hint = f"for profile '{DATABRICKS_PROFILE}'" if DATABRICKS_PROFILE else "(using default auth)"
        return None, f"Connection failed: {str(e)}. {env_hint}"


def execute_query(query, return_dict=False):
    """
    Execute a SQL query and return results
    
    Args:
        query (str): SQL query to execute
        return_dict (bool): If True, return dict format. If False, return DataFrame
        
    Returns:
        pandas.DataFrame or dict or None: Query results or None on error
    """
    # Create fresh connection for each query
    connection, error = get_databricks_connection()
    
    if error:
        raise Exception(f"Connection Error: {error}")
    
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        
        # Fetch results
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        # Convert to DataFrame
        df = pd.DataFrame(rows, columns=columns)
        
        if return_dict:
            return df.to_dict(orient='records')
        return df
        
    except Exception as e:
        # Try to close connection on error
        try:
            connection.close()
        except:
            pass
        raise Exception(f"Query Error: {str(e)}")


def get_table_schema(table_name):
    """
    Get schema information for a table
    
    Args:
        table_name (str): Fully qualified table name (catalog.schema.table)
        
    Returns:
        list: List of column info dicts
    """
    query = f"DESCRIBE TABLE {table_name}"
    result = execute_query(query, return_dict=True)
    return result


def test_connection():
    """
    Test the database connection
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        result = execute_query("SELECT 1 as test")
        return len(result) > 0
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False
