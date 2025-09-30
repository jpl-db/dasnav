# Quick Start Guide

Get up and running with the Timeseries Explorer app in 5 minutes.

## For Local Development

### Step 1: Set Up Authentication

Run the automated setup script:

```bash
./setup_auth.sh
```

When prompted, enter:
1. **Workspace URL** for logfood-central (e.g., `https://your-workspace.cloud.databricks.com`)
2. **SQL Warehouse ID** (find in Databricks UI under SQL > Warehouses)

This will:
- Configure OAuth authentication
- Create a `.env` file with your settings
- Set up credentials for querying Databricks tables

### Step 2: Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 3: Run the App

```bash
streamlit run app.py --server.port 8000
```

Open http://localhost:8000 in your browser.

### Step 4: Test with Data

1. **Try Sample Data** (default):
   - Select "Sample Data" in the sidebar
   - Explore the interactive charts

2. **Upload CSV**:
   - Select "Upload CSV" in the sidebar
   - Upload any CSV with a `timestamp` and `value` column

3. **Query Databricks Table**:
   - Select "Databricks Table" in the sidebar
   - Enter a table name (e.g., `catalog.schema.table_name`)
   - The app will query using YOUR credentials

## For Deployment to logfood-central

### Step 1: Update Configuration

Edit `app.yaml` and set your SQL Warehouse ID:

```yaml
resources:
  sql_warehouse_id: "your-warehouse-id-here"
```

### Step 2: Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

Quick option:
1. Push code to GitHub
2. In Databricks: **New** → **App** → Connect to Git repo
3. Configure and deploy

## Need Help?

- **Full documentation**: See [README.md](README.md)
- **Deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Authentication issues**: Run `databricks auth token` to check your credentials
