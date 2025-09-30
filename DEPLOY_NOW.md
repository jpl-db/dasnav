# 🚀 Ready to Deploy!

## ✅ Latest Changes Pushed to GitHub

Your `dasnav` app is ready to deploy with the latest Lovable UI!

**GitHub Repo**: https://github.com/jpl-db/dasnav  
**Branch**: `main`

---

## 📦 What's Included in This Deployment

1. **Latest Lovable UI** - Imported from `uc-glimpse`
2. **Backend API** - Flask API with Databricks SQL queries
3. **Production Build** - `app.yaml` configured for:
   - Frontend build (`npm run build`)
   - Static file serving with `serve`
   - Backend API on port 8001
   - Frontend served on port 8000

---

## 🎯 Deploy to Databricks (pm-bootcamp)

### Option 1: Deploy via Databricks UI (Recommended)

1. **Go to your Databricks workspace** (pm-bootcamp)
   - URL: Your pm-bootcamp workspace

2. **Navigate to Apps**
   - Click on **Apps** in the left sidebar

3. **Find your app** (`dasnav`)
   - Should already be linked to https://github.com/jpl-db/dasnav

4. **Click "Deploy"**
   - Select branch: `main`
   - Click **Deploy** again to confirm

5. **Monitor the deployment**
   - Watch the logs for any errors
   - Deployment typically takes 3-5 minutes

6. **Access your app**
   - **App URL**: https://dasnav-3755057911985085.staging.aws.databricksapps.com
   - Or find it in the Apps list

---

### Option 2: Deploy via CLI (Alternative)

If you prefer the CLI:

```bash
databricks apps deploy dasnav \
  --source-code-path /Users/jon.levine/code/dasnav \
  --profile pm-bootcamp
```

**Note**: The UI method is more reliable as it's already linked to GitHub.

---

## 🔍 What Happens During Deployment

The `app.yaml` command will:

1. Install frontend npm dependencies
2. Build the React app (`npm run build`)
3. Install backend Python dependencies
4. Start Flask API on port 8001 (background)
5. Serve built frontend on port 8000

---

## ⚠️ Important Notes

### Authentication
- **Local dev**: Uses your `pm-bootcamp` profile credentials
- **Deployed app**: Uses Databricks App Service Principal (managed automatically)

### SQL Warehouse
- Using: **Serverless Starter Warehouse** (`9851b1483bb515e6`)
- This is pre-configured in `app.yaml`

### Environment Variables
The deployed app will automatically use:
- `DATABRICKS_PROFILE=pm-bootcamp`
- `API_PORT=8001`

---

## 🐛 Troubleshooting Deployment

### If deployment fails:

1. **Check the logs** in Databricks UI
   - Look for build errors or missing dependencies

2. **Common issues:**
   - **npm install fails**: Check `frontend/package.json` for invalid packages
   - **Python dependencies fail**: Check `backend/requirements.txt`
   - **App won't start**: Check that ports 8000 and 8001 aren't conflicting

3. **Fix and redeploy:**
   ```bash
   # Make fixes locally
   git add .
   git commit -m "Fix deployment issue"
   git push
   # Then redeploy via UI
   ```

---

## ✨ After Deployment

Once deployed, your app will be available at:
**https://dasnav-3755057911985085.staging.aws.databricksapps.com**

### Test the deployment:
1. **Check backend health**: https://[your-app-url]/api/health
2. **Load the UI**: https://[your-app-url]/
3. **Try a query**: Use the UI to query `samples.nyctaxi.trips`

---

## 🎉 You're All Set!

Your Lovable UI is now integrated with the Databricks backend and ready to deploy. Just click **Deploy** in the Databricks UI!
