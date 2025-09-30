# Timeseries Data Explorer

A Databricks App for exploring and visualizing timeseries data interactively.

**GitHub Repository**: https://github.com/jpl-db/dasnav  
**Databricks App URL**: https://dasnav-3755057911985085.staging.aws.databricksapps.com

## Overview

This app provides an interactive interface for:
- Loading timeseries data from multiple sources (CSV uploads, Databricks tables, or sample data)
- Visualizing data with various chart types (line, area, scatter, candlestick)
- Computing and displaying moving averages and trend lines
- Analyzing basic statistics and distributions

## Prerequisites

### Databricks Workspace Setup
- Workspace must be in a region that supports serverless compute
- Network must allow outbound access to `*.databricksapps.com`

### Local Development Environment
- Python 3.11 or above
- Databricks CLI 0.229.0 or above
- Databricks SDK for Python

## Installation

### Prerequisites

You should already have:
- ✅ Databricks CLI installed and configured
- ✅ A profile for pm-bootcamp (verify with `databricks auth profiles`)

If not, run:
```bash
databricks auth login --host https://your-workspace.cloud.databricks.com --profile pm-bootcamp
```

### Setup Steps

#### 1. SQL Warehouse Configuration

The app is pre-configured to use the **Serverless Starter Warehouse** in pm-bootcamp:
- Warehouse ID: `9851b1483bb515e6`
- Already set in `.env` and `app.yaml`

No additional configuration needed! ✅

#### 2. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Local Development

### Run Locally

To test the app locally before deploying to Databricks:

```bash
# Activate virtual environment
source venv/bin/activate

# Run the app
streamlit run app.py --server.port 8000
```

The app will be available at `http://localhost:8000`

### Querying Databricks Tables Locally

When you select "Databricks Table" as the data source, the app will:
1. Use your authenticated Databricks credentials (from `databricks auth login`)
2. Connect to the SQL Warehouse specified in your `.env` file
3. Run queries as YOUR user (with your permissions)

This means:
- ✅ You can test with real Databricks data locally
- ✅ Queries run with your permissions and audit trail
- ✅ No need to mock data or use different credentials

### Authentication Flow

**Local Development:**
- Uses OAuth credentials from `databricks auth login` (stored in `~/.databrickscfg`)
- Queries run as your user account
- Full access to tables you have permissions for

**Deployed App:**
- Uses the app's service principal or configured credentials
- Queries run as the app user
- Access controlled by app permissions

## Deploying to Databricks

### Option 1: Create App via UI (Recommended for First Time)

1. In Databricks workspace, click **New** > **App**
2. Select **Custom** option
3. Enter app name (e.g., `timeseries-explorer`)
   - Name must be lowercase, numbers, and hyphens only
   - Name cannot be changed after creation
4. Click **Create app**

### Option 2: Deploy via CLI

#### Upload App Files to Workspace

```bash
# Export app files to Databricks workspace
databricks workspace import-dir . /Workspace/Users/your-email@company.com/timeseries-explorer
```

#### Deploy the App

```bash
# Navigate to your app in the Databricks workspace and deploy
# Or use the Databricks Apps API to deploy programmatically
```

## Project Structure

```
dasnav/
├── app.py                 # Main Streamlit application
├── requirements.txt       # Python dependencies
├── databricks.yml        # Databricks app configuration
└── README.md             # This file
```

## Features

### Current Features
- 📊 Multiple data source support (CSV upload, sample data)
- 📈 Multiple visualization types (line, area, scatter charts)
- 📉 Statistical analysis and distribution plots
- 🔄 Moving average calculations
- 📱 Responsive layout

### Planned Features
- 🔗 Databricks SQL table integration
- 🤖 Anomaly detection
- 📊 Advanced time series decomposition
- 💾 Save and load analysis configurations
- 📤 Export results

## Configuration

### Databricks SQL Warehouse

The app uses the **Serverless Starter Warehouse** (ID: `9851b1483bb515e6`) for both local development and deployment.

This warehouse is pre-configured in:
- `.env` - for local development
- `app.yaml` - for deployment

If you need to use a different warehouse, update both files with the new warehouse ID.

### Environment Variables

The app uses the following environment variables (configured in `databricks.yml`):
- `STREAMLIT_SERVER_HEADLESS`: Set to "true" for Databricks deployment
- Port 8080 is used by default for Databricks Apps

## Usage

1. **Select Data Source**: Choose from sample data, CSV upload, or Databricks table
2. **Configure Visualization**: Select chart type and options (moving average, trend lines)
3. **Explore Data**: View interactive charts and statistics
4. **Analyze**: Use the built-in statistical tools to understand your data

## Databricks Environment

**Target Environment**: `pm-bootcamp`

App URL: https://dasnav-3755057911985085.staging.aws.databricksapps.com

## Troubleshooting

### App won't start
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.11+)
- Verify Databricks CLI is configured: `databricks auth token`

### Can't connect to Databricks tables
- Ensure SQL Warehouse ID is configured in `databricks.yml`
- Verify you have proper permissions to access the SQL Warehouse
- Check network connectivity to Databricks workspace

### Files too large error
- Individual files cannot exceed 10 MB
- Consider optimizing large data files or loading them from Databricks tables

## Resources

- [Databricks Apps Documentation](https://docs.databricks.com/dev-tools/databricks-apps/)
- [Streamlit Documentation](https://docs.streamlit.io/)
- [Databricks SDK for Python](https://docs.databricks.com/dev-tools/sdk-python.html)

## License

Internal use only - [Your Organization]
