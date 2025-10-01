# 🎯 Simple Lovable + Databricks Workflow

**Backend deployed at**: `https://dasnav-3755057911985085.staging.aws.databricksapps.com`  
**Lovable app**: `https://github.com/jpl-db/uc-glimpse`

---

## ✅ The Simplified Architecture

### **Local Development:**
1. Work in Lovable → It calls your **deployed** Databricks backend
2. No local backend needed!
3. No proxies, no CORS headaches

### **Deployment:**
1. Export from Lovable → Push to `frontend/` in this repo
2. Push to GitHub
3. Deploy in Databricks UI

---

## 🚀 Your Daily Workflow

### **1. Develop UI in Lovable**
```
Open Lovable.app → Work on your UI
↓
Lovable calls: https://dasnav-3755057911985085.staging.aws.databricksapps.com/api
↓
See changes instantly!
```

**No backend to run locally** ✨

### **2. When Ready to Deploy**
```bash
# Pull latest Lovable code
./import_lovable.sh https://github.com/jpl-db/uc-glimpse

# Commit and push
git add frontend/
git commit -m "Update UI from Lovable"
git push
```

### **3. Deploy in Databricks**
1. Go to Databricks UI → Apps → dasnav
2. Click **Deploy**
3. Done! ✅

---

## 🔌 API Configuration

The frontend is configured to call the deployed Databricks backend:

```typescript
// frontend/src/lib/databricksApi.ts
const API_BASE = 'https://dasnav-3755057911985085.staging.aws.databricksapps.com/api';
```

To test with a local backend (for backend development only):
```bash
# In frontend/.env.local (create this file)
VITE_API_URL=http://localhost:8001/api
```

---

## 📁 Repository Structure

```
dasnav/
├── frontend/           # Lovable UI (import here when ready)
│   ├── src/
│   │   └── lib/databricksApi.ts  # Configured to call deployed backend
│   └── vite.config.ts            # No proxy needed!
│
├── backend/            # Python Flask API
│   ├── api.py         # CORS enabled for Lovable
│   ├── db.py          # Databricks connection
│   └── tests/         # Backend tests
│
├── app.yaml           # Databricks deployment config
└── import_lovable.sh  # Helper to pull from Lovable repo
```

---

## 🎨 Two-Repo Setup

```
lovable-dasnav-ui/     ← Lovable manages this
└── Your Lovable UI (auto-commits from Lovable.app)

dasnav/                ← Your Databricks deployment repo  
└── frontend/          ← Copy here when ready
```

**Why?**
- ✅ Lovable can auto-commit without conflicts
- ✅ You edit backend without touching Lovable
- ✅ Clean separation
- ✅ Copy to `dasnav` only when UI is ready

---

## 🔧 Backend Development

Only needed if you're changing the **backend API**:

```bash
cd backend
source ../venv/bin/activate
python api.py  # Runs on port 8001

# Test backend
python test_e2e.py
```

Then deploy to Databricks so Lovable can call it!

---

## 🌐 Deployed URLs

| Service | URL |
|---------|-----|
| **Deployed App** | https://dasnav-3755057911985085.staging.aws.databricksapps.com |
| **Backend API** | https://dasnav-3755057911985085.staging.aws.databricksapps.com/api |
| **Lovable Repo** | https://github.com/jpl-db/uc-glimpse |
| **Deployment Repo** | https://github.com/jpl-db/dasnav |

---

## 💡 Common Tasks

### **Update UI from Lovable**
```bash
./import_lovable.sh https://github.com/jpl-db/uc-glimpse
git add frontend/ && git commit -m "Update UI" && git push
# Then deploy in Databricks UI
```

### **Update Backend**
```bash
# Make changes in backend/
git add backend/ && git commit -m "Update API" && git push
# Then deploy in Databricks UI
```

### **Test Locally (Frontend Only)**
```bash
cd frontend
npm install
npm run dev  # Opens on http://localhost:8080
# Calls deployed Databricks backend automatically!
```

---

## ✨ Benefits of This Approach

✅ **Simple**: No local backend to manage  
✅ **Fast**: Lovable preview works immediately  
✅ **Clean**: Separate repos = no conflicts  
✅ **Flexible**: Override API URL for testing if needed  
✅ **Production-ready**: Deployed backend is always available  

---

**Questions?** Check `LOVABLE_API_SPEC.md` for API details!
