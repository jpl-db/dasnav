"""
Databricks App: SQL Query Interface
A simple SQL query interface for Unity Catalog tables
"""

import streamlit as st
import pandas as pd
import os
from databricks import sql
from databricks.sdk import WorkspaceClient

# Configuration
DATABRICKS_PROFILE = os.getenv("DATABRICKS_PROFILE", "pm-bootcamp")
SQL_WAREHOUSE_ID = os.getenv("DATABRICKS_SQL_WAREHOUSE_ID", "")

# Configure the Streamlit page
st.set_page_config(
    page_title="SQL Query Interface",
    page_icon="🔍",
    layout="wide"
)

# Main title
st.title("🔍 SQL Query Interface")
st.markdown("Query Unity Catalog tables directly from your Databricks workspace")




@st.cache_resource
def get_databricks_connection():
    """Get Databricks SQL connection using CLI profile credentials"""
    try:
        # Initialize WorkspaceClient with profile (uses ~/.databrickscfg)
        w = WorkspaceClient(profile=DATABRICKS_PROFILE)
        
        # Get warehouse ID from environment or show error
        warehouse_id = SQL_WAREHOUSE_ID
        if not warehouse_id:
            return None, "Please set DATABRICKS_SQL_WAREHOUSE_ID environment variable"
        
        # Create SQL connection using profile credentials
        connection = sql.connect(
            server_hostname=w.config.host.replace("https://", ""),
            http_path=f"/sql/1.0/warehouses/{warehouse_id}",
            credentials_provider=w.config.authenticate
        )
        
        return connection, None
    except Exception as e:
        return None, f"Connection failed: {str(e)}. Ensure 'databricks auth login' is configured for profile '{DATABRICKS_PROFILE}'"


def execute_query(query):
    """Execute a SQL query and return results as DataFrame"""
    connection, error = get_databricks_connection()
    
    if error:
        st.error(f"❌ Connection Error: {error}")
        return None
    
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        
        # Fetch results
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        cursor.close()
        
        # Convert to DataFrame
        df = pd.DataFrame(rows, columns=columns)
        return df
        
    except Exception as e:
        st.error(f"❌ Query Error: {str(e)}")
        return None


# Input section
st.subheader("Query Configuration")

col1, col2 = st.columns([2, 1])

with col1:
    table_name = st.text_input(
        "Unity Catalog Table",
        value="samples.nyctaxi.trips",
        help="Enter the full table name: catalog.schema.table"
    )

with col2:
    limit = st.number_input(
        "Limit",
        min_value=1,
        max_value=10000,
        value=100,
        help="Maximum number of rows to return"
    )

# SQL Query input
query = st.text_area(
    "SQL Query",
    value=f"SELECT * FROM {table_name} LIMIT {limit}",
    height=150,
    help="Enter your SQL query here. The table name above will be used in the default query."
)

# Update query when table name or limit changes
if st.button("🔄 Update Query from Table Name"):
    query = f"SELECT * FROM {table_name} LIMIT {limit}"
    st.rerun()

# Execute button
if st.button("▶️ Execute Query", type="primary"):
    with st.spinner("Executing query..."):
        result_df = execute_query(query)
        
        if result_df is not None:
            st.success(f"✅ Query executed successfully! Returned {len(result_df):,} rows")
            
            # Display results
            st.subheader("Query Results")
            
            # Metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Rows", f"{len(result_df):,}")
            with col2:
                st.metric("Columns", len(result_df.columns))
            with col3:
                st.metric("Memory", f"{result_df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
            
            # Data table
            st.dataframe(result_df, use_container_width=True, height=400)
            
            # Download button
            csv = result_df.to_csv(index=False)
            st.download_button(
                label="📥 Download as CSV",
                data=csv,
                file_name="query_results.csv",
                mime="text/csv"
            )
else:
    st.info("👆 Click 'Execute Query' to run your SQL query")

# Footer
st.markdown("---")
st.markdown(
    f"""
    <div style='text-align: center; color: gray; font-size: 0.8em;'>
    Connected to: {DATABRICKS_PROFILE} | Warehouse ID: {SQL_WAREHOUSE_ID}
    </div>
    """,
    unsafe_allow_html=True
)
