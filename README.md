# Databricks App - Hybrid Architecture

A Databricks App with **React Frontend + Python Backend** for querying Unity Catalog tables.

**GitHub Repository**: https://github.com/jpl-db/dasnav  
**Databricks App URL**: https://dasnav-3755057911985085.staging.aws.databricksapps.com

## 🏗️ Architecture

- **Frontend**: React app (Lovable.dev export goes here)
- **Backend**: Python Flask API for Databricks SQL queries
- **Database**: Unity Catalog via SQL Warehouse

## 📁 Project Structure

```
dasnav/
├── frontend/          # YOUR LOVABLE EXPORT GOES HERE
│   └── README.md      # Integration instructions
├── backend/           # Python API (ready to use)
│   ├── api.py        # Flask REST API
│   ├── db.py         # Databricks queries
│   └── tests...
├── app.yaml          # Databricks deployment config
└── run_local.sh      # Start both services
```

## 🚀 Quick Start

### Current Status:
✅ **Backend API is ready and tested**  
⏳ **Waiting for your Lovable frontend**

### To Add Your Lovable UI:
1. Export your Lovable project
2. Drop files into `frontend/` directory
3. See `frontend/README.md` and `HYBRID_SETUP.md` for integration

### Run Locally:
```bash
# Backend only (current)
cd backend && python api.py

# Full stack (after adding frontend)
./run_local.sh
```

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

Create a `.env` file from the example:

```bash
cp .env.example .env
```

The example is pre-configured with the **Serverless Starter Warehouse** ID for pm-bootcamp (`9851b1483bb515e6`).

The `.env` file is gitignored to prevent accidental credential leaks. ✅

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
- 🔍 SQL query execution against Unity Catalog
- 📊 Interactive results table
- 📥 Download results as CSV
- ⚡ Fast queries using Databricks SQL Warehouse
- 🔐 Secure authentication via CLI profile

### Planned Features
- 📝 Query history
- 💾 Saved queries
- 📊 Data visualization
- 📈 Query performance metrics

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

1. **Enter Table Name**: Default is `samples.nyctaxi.trips`, or enter any Unity Catalog table
2. **Write SQL Query**: Edit the pre-filled query or write your own
3. **Execute**: Click "Execute Query" to run the query
4. **View Results**: See results in an interactive table with download option

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
