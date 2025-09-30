# Deployment Guide for logfood-central

This guide covers deploying the Timeseries Explorer app to the `logfood-central` Databricks environment.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Databricks CLI installed and authenticated
2. ✅ Access to logfood-central Databricks workspace
3. ✅ SQL Warehouse available for the app to use
4. ✅ Permissions to create apps in the workspace

## Deployment Steps

### Step 1: Authenticate with logfood-central

```bash
databricks auth login --host https://your-logfood-workspace.cloud.databricks.com
```

### Step 2: Create the App in Databricks

You have two options:

#### Option A: Using Databricks UI

1. Navigate to your Databricks workspace
2. Click **New** → **App**
3. Choose **Custom app**
4. Enter app details:
   - **Name**: `timeseries-explorer` (lowercase, hyphens only)
   - **Source**: Git repository or upload files
5. Configure resources:
   - Select your SQL Warehouse ID
6. Click **Create**

#### Option B: Using Databricks CLI (Coming Soon)

```bash
# Upload app files to workspace
databricks workspace import-dir . /Workspace/Users/your-email/timeseries-explorer

# Deploy app (requires Apps API)
databricks apps deploy timeseries-explorer
```

### Step 3: Configure App Resources

The app requires access to:

1. **SQL Warehouse**: Set in `app.yaml`
   ```yaml
   resources:
     sql_warehouse_id: "your-warehouse-id-here"
   ```

2. **Environment Variables** (if needed):
   - Set in Databricks App configuration UI
   - Or in `app.yaml` under `env:` section

### Step 4: Set Up App Permissions

After deployment, configure who can access the app:

1. Go to your app in Databricks workspace
2. Click **Permissions**
3. Add users/groups who should access the app
4. Set appropriate permission levels

## App Configuration

### app.yaml

The `app.yaml` file defines how the app runs:

```yaml
# Command to start the app
command: ["streamlit", "run", "app.py", "--server.port", "8000", "--server.enableCORS", "false"]

# Environment variables
env:
  - name: STREAMLIT_SERVER_HEADLESS
    value: "true"

# Resources (configure before deployment)
# resources:
#   sql_warehouse_id: "your-warehouse-id-here"
```

Update the SQL Warehouse ID before deploying.

## Testing the Deployment

After deployment:

1. Navigate to your app URL (provided by Databricks)
2. Test with sample data first
3. Try loading a Databricks table you have access to
4. Verify authentication works (app should use its service principal)

## Monitoring and Logs

To view app logs:

1. Go to your app in Databricks workspace
2. Click on the **Logs** tab
3. Monitor for errors or issues

## Updating the App

To update an existing deployment:

### Using Git (Recommended)

1. Push changes to your Git repository
2. In Databricks, go to your app
3. Click **Update from Git**
4. Select the branch/commit to deploy

### Manual Upload

1. Make your changes locally
2. Upload updated files to workspace
3. Restart the app in Databricks UI

## Troubleshooting

### App won't start

- Check logs for Python errors
- Verify all dependencies are in `requirements.txt`
- Ensure `app.yaml` command is correct

### Can't connect to SQL Warehouse

- Verify SQL Warehouse ID is correct
- Check app has permission to use the warehouse
- Ensure warehouse is running

### Authentication errors

- Verify app service principal has required permissions
- Check Unity Catalog access if using UC tables
- Review app permissions settings

## Security Best Practices

1. **Use service principals** for app authentication (not user PATs)
2. **Grant minimal permissions** - only access to required tables
3. **Use Unity Catalog** for fine-grained access control
4. **Review app logs** regularly for security events
5. **Limit app user access** to only those who need it

## Rollback

If deployment fails or causes issues:

1. Go to your app in Databricks
2. View deployment history
3. Click **Rollback** to previous version
4. Or update Git branch to previous commit

## Support

For issues with deployment:
- Check [Databricks Apps Documentation](https://docs.databricks.com/dev-tools/databricks-apps/)
- Contact your Databricks workspace admin
- Review app logs for specific error messages
