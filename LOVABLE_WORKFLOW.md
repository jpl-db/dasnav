# Lovable + Databricks Workflow

**The simple, practical way to build UIs with Lovable and test against real Unity Catalog data.**

---

## 🎯 The Workflow

### **Step 1: Develop UI in Lovable (Mock Data)**

**What:** Build and iterate on your UI in Lovable with mock data  
**Where:** https://lovable.dev/projects/f4359c07-c3fc-4c76-baba-063daa41def3  
**Why:** Fast iteration, no backend needed, great for visual design

```
Lovable → Mock NYC Taxi Data → Beautiful UI ✨
```

**Just code in Lovable!** The mock data is already configured:
- `samples.nyctaxi.trips` → Returns realistic taxi trip data
- All schema and query hooks work with mock data
- No backend server needed

---

### **Step 2: Pull Changes & Test Locally (Real UC Data)**

**What:** Pull your Lovable UI and test against real Unity Catalog  
**Where:** Your laptop  
**Why:** Verify queries work with real data before deploying

```bash
# Pull latest UI from Lovable
./import_lovable.sh https://github.com/jpl-db/uc-glimpse

# Start backend + frontend with real UC data
./run_local.sh
```

**What happens:**
- ✅ Frontend runs on `http://localhost:8080`
- ✅ Backend runs on `http://localhost:8001`
- ✅ Mock mode is **disabled** (VITE_USE_MOCK=false)
- ✅ Queries hit real Unity Catalog via your Databricks credentials

---

### **Step 3: Deploy (Optional - Internal Use)**

**What:** Deploy to Databricks Apps for authenticated workspace users  
**Where:** Databricks workspace  
**Why:** Share with team members (requires Databricks login)

```bash
# Commit changes
git add frontend/
git commit -m "Update UI from Lovable"
git push

# Then in Databricks UI:
# Apps → dasnav → Deploy
```

**Note:** Databricks Apps require authentication - **not for public access**.

---

## 🔄 Day-to-Day Development

### **Quick Iteration (Lovable)**
```
1. Open Lovable
2. Make UI changes
3. See changes instantly with mock data
4. Repeat! 🚀
```

### **Testing with Real Data (Local)**
```bash
./import_lovable.sh https://github.com/jpl-db/uc-glimpse
./run_local.sh
# Open http://localhost:8080
# Test real queries!
```

---

## 🎛️ How Mock Mode Works

The frontend automatically detects whether to use mock or real data:

### **In Lovable (Mock Mode)**
- `VITE_USE_MOCK` is not set → **defaults to true**
- Uses `generateDefaultTaxiDataset()` for data
- No backend needed
- Great for UI development

### **Running Locally (Real Mode)**
- `run_local.sh` sets `VITE_USE_MOCK=false`
- Calls `http://localhost:8001/api`
- Uses real Databricks credentials
- Tests against Unity Catalog

### **Manual Override**
You can also set it manually:

```bash
# In frontend directory
cd frontend

# Use real backend
VITE_USE_MOCK=false npm run dev

# Use mock data
VITE_USE_MOCK=true npm run dev

# Or just run in Lovable (always uses mock data)
```

---

## 📁 Project Structure

```
dasnav/
├── frontend/                    # Lovable UI goes here
│   ├── src/
│   │   ├── lib/
│   │   │   └── databricksApi.ts   # API calls (localhost by default)
│   │   └── hooks/
│   │       └── useDatabricks.ts   # Auto-detects mock vs real
│   └── ...
├── backend/                     # Python Flask API
│   ├── api.py                  # REST API endpoints
│   ├── db.py                   # UC queries
│   └── requirements.txt
├── import_lovable.sh           # Pull UI from Lovable repo
├── run_local.sh                # Start frontend + backend
└── app.yaml                    # Databricks deployment config
```

---

## ✨ Benefits of This Approach

**✅ Fast UI Development**
- Work in Lovable with instant feedback
- No backend complexity while designing

**✅ Easy Real Data Testing**
- One command to test against Unity Catalog
- Your credentials, your data

**✅ Simple Deployment**
- Push to GitHub → Deploy in Databricks UI
- Works for internal team tools

**✅ No CORS/Auth Headaches**
- Lovable uses mock data (no backend calls)
- Local testing uses same-origin requests
- Databricks Apps handles auth automatically

---

## 🚨 Important Notes

1. **Databricks Apps are NOT public**  
   - Require workspace authentication
   - Perfect for internal tools
   - Can't be called from external sites

2. **Lovable is for UI only**  
   - Uses mock data
   - No real backend integration
   - That's the point! Fast iteration!

3. **Local testing is your integration environment**  
   - Where you verify real queries
   - Where you test auth flows
   - Where you catch bugs before deploying

---

## 📝 Example: Adding a New Feature

```
1. In Lovable:
   - Add new chart type
   - Use mock data
   - Get it looking great ✨

2. Pull and test locally:
   $ ./import_lovable.sh https://github.com/jpl-db/uc-glimpse
   $ ./run_local.sh
   - Verify it works with real UC data
   - Test edge cases
   - Fix any query issues

3. Deploy (if ready):
   $ git add frontend/ && git commit -m "Add new chart type"
   $ git push
   - Deploy in Databricks UI
   - Share with team!
```

---

**Questions?** Check `frontend/README.md` or `frontend/LOVABLE_GUIDE.md`

