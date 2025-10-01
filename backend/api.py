"""
Flask API server for Databricks SQL queries
Provides REST endpoints for the frontend to execute queries
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from db import execute_query, get_table_schema, test_connection

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for Lovable dev environment and Databricks Apps
# Allows calls from Lovable.app, localhost, and deployed frontend
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins for development
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'databricks-query-api',
        'profile': os.getenv('DATABRICKS_PROFILE', 'pm-bootcamp')
    })


@app.route('/api/test-connection', methods=['GET'])
def test_db_connection():
    """Test database connection"""
    try:
        is_connected = test_connection()
        if is_connected:
            return jsonify({
                'status': 'success',
                'message': 'Database connection successful'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Database connection failed'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/query', methods=['POST'])
def run_query():
    """
    Execute a SQL query
    
    Request body:
    {
        "query": "SELECT * FROM table LIMIT 10"
    }
    
    Response:
    {
        "status": "success",
        "data": [...],
        "row_count": 10,
        "columns": [...]
    }
    """
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({
                'status': 'error',
                'message': 'Query parameter is required'
            }), 400
        
        # Execute query and get results as dict
        results = execute_query(query, return_dict=True)
        
        # Get column names from first result if available
        columns = list(results[0].keys()) if results else []
        
        return jsonify({
            'status': 'success',
            'data': results,
            'row_count': len(results),
            'columns': columns
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/schema/<path:table_name>', methods=['GET'])
def get_schema(table_name):
    """
    Get table schema
    
    URL params:
        table_name: Fully qualified table name (catalog.schema.table)
    
    Response:
    {
        "status": "success",
        "schema": [...]
    }
    """
    try:
        schema = get_table_schema(table_name)
        return jsonify({
            'status': 'success',
            'table': table_name,
            'schema': schema
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.getenv('API_PORT', 8001))
    
    print(f"🚀 Starting Databricks Query API on port {port}")
    print(f"📊 Profile: {os.getenv('DATABRICKS_PROFILE', 'pm-bootcamp')}")
    print(f"🔗 Warehouse: {os.getenv('DATABRICKS_SQL_WAREHOUSE_ID', 'not set')}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )
