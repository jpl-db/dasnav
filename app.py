"""
Databricks App: Timeseries Data Explorer
A Streamlit-based application for exploring and visualizing timeseries data
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os

# Configure the Streamlit page
st.set_page_config(
    page_title="Timeseries Explorer",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Main title
st.title("📈 Timeseries Data Explorer")
st.markdown("Explore and visualize your timeseries data interactively")

# Sidebar configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # Data source selection
    data_source = st.selectbox(
        "Select Data Source",
        ["Sample Data", "Upload CSV", "Databricks Table"]
    )
    
    st.markdown("---")
    
    # Visualization options
    st.subheader("Visualization Options")
    chart_type = st.selectbox(
        "Chart Type",
        ["Line Chart", "Area Chart", "Scatter Plot", "Candlestick"]
    )
    
    show_trend = st.checkbox("Show Trend Line", value=False)
    show_moving_avg = st.checkbox("Show Moving Average", value=False)
    
    if show_moving_avg:
        window_size = st.slider("Moving Average Window", 5, 50, 20)


def generate_sample_data():
    """Generate sample timeseries data for demonstration"""
    dates = pd.date_range(
        start=datetime.now() - timedelta(days=365),
        end=datetime.now(),
        freq='D'
    )
    
    # Generate some sample data with trend and seasonality
    import numpy as np
    np.random.seed(42)
    
    trend = np.linspace(100, 150, len(dates))
    seasonal = 20 * np.sin(np.linspace(0, 4 * np.pi, len(dates)))
    noise = np.random.normal(0, 5, len(dates))
    
    values = trend + seasonal + noise
    
    df = pd.DataFrame({
        'timestamp': dates,
        'value': values,
        'category': np.random.choice(['A', 'B', 'C'], len(dates))
    })
    
    return df


def load_data(source_type):
    """Load data based on selected source"""
    if source_type == "Sample Data":
        return generate_sample_data()
    elif source_type == "Upload CSV":
        uploaded_file = st.file_uploader("Choose a CSV file", type="csv")
        if uploaded_file is not None:
            return pd.read_csv(uploaded_file)
        return None
    elif source_type == "Databricks Table":
        # Placeholder for Databricks SQL connection
        st.info("Connect to Databricks SQL to query tables")
        # TODO: Implement Databricks SQL connection
        return generate_sample_data()
    
    return None


# Load the data
df = load_data(data_source)

if df is not None:
    # Main content area
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Records", f"{len(df):,}")
    
    with col2:
        if 'timestamp' in df.columns:
            st.metric("Date Range", f"{(df['timestamp'].max() - df['timestamp'].min()).days} days")
    
    with col3:
        if 'value' in df.columns:
            st.metric("Avg Value", f"{df['value'].mean():.2f}")
    
    st.markdown("---")
    
    # Data preview
    with st.expander("📊 Data Preview", expanded=False):
        st.dataframe(df.head(100), use_container_width=True)
    
    # Main visualization
    st.subheader("Visualization")
    
    if 'timestamp' in df.columns and 'value' in df.columns:
        # Create the base chart
        if chart_type == "Line Chart":
            fig = px.line(df, x='timestamp', y='value', title='Timeseries Data')
        elif chart_type == "Area Chart":
            fig = px.area(df, x='timestamp', y='value', title='Timeseries Data')
        elif chart_type == "Scatter Plot":
            fig = px.scatter(df, x='timestamp', y='value', title='Timeseries Data')
        elif chart_type == "Candlestick":
            # For candlestick, we'd need OHLC data - using line as fallback
            fig = px.line(df, x='timestamp', y='value', title='Timeseries Data')
        
        # Add moving average if requested
        if show_moving_avg:
            df['moving_avg'] = df['value'].rolling(window=window_size).mean()
            fig.add_scatter(
                x=df['timestamp'], 
                y=df['moving_avg'],
                mode='lines',
                name=f'MA({window_size})',
                line=dict(color='red', dash='dash')
            )
        
        # Update layout
        fig.update_layout(
            xaxis_title="Time",
            yaxis_title="Value",
            hovermode='x unified',
            height=500
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Statistics section
        st.subheader("📉 Statistics")
        
        stats_col1, stats_col2 = st.columns(2)
        
        with stats_col1:
            st.write("**Summary Statistics**")
            st.dataframe(df[['value']].describe())
        
        with stats_col2:
            st.write("**Distribution**")
            fig_hist = px.histogram(df, x='value', nbins=50)
            st.plotly_chart(fig_hist, use_container_width=True)
    
    else:
        st.warning("Please ensure your data contains 'timestamp' and 'value' columns")

else:
    st.info("👈 Select a data source from the sidebar to get started")


# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: gray; font-size: 0.8em;'>
    Databricks Timeseries Explorer App | Built with Streamlit
    </div>
    """,
    unsafe_allow_html=True
)
