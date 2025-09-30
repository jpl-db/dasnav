# Hybrid Architecture Setup Guide

## 🏗️ Architecture Overview

This Databricks App uses a **hybrid architecture**:
- **Frontend**: React app (from Lovable.dev)
- **Backend**: Python Flask API (Databricks SQL queries)

```
┌─────────────────┐
│  React Frontend │  (Port 3000/8000)
│   (Lovable UI)  │
└────────┬────────┘
         │ HTTP Requests
         │ /api/*
         ▼
┌─────────────────┐
│  Flask Backend  │  (Port 8001)
│   (Python API)  │
└────────┬────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│   Databricks    │
│  SQL Warehouse  │
└─────────────────┘
```

## 📁 Directory Structure

```
dasnav/
├── frontend/                # DROP YOUR LOVABLE EXPORT HERE
│   ├── package.json        # Will be from Lovable
│   ├── src/                # React components
│   ├── public/             # Static assets
│   └── README.md           # Instructions for integration
│
├── backend/                # Python API (already set up)
│   ├── api.py             # Flask REST API
│   ├── db.py              # Databricks connection & queries
│   ├── app.py             # Original Streamlit app (kept for reference)
│   ├── test_connection.py # Connection tests
│   └── test_api.py        # API endpoint tests
│
├── .env                    # Local config (gitignored)
├── .env.example           # Template
├── app.yaml               # Databricks deployment config
├── run_local.sh           # Start both frontend & backend
└── README.md              # Main documentation
```

## 🚀 Quick Start

### 1. Current State (Backend Only)

The Python API is ready and working:

```bash
# Test the backend
cd backend
python api.py

# In another terminal, test endpoints
python backend/test_api.py
```

API is running at: **http://localhost:8001**

### 2. Add Your Lovable Frontend

**When you're ready**, export your Lovable project and place the files in `frontend/`:

```bash
# Your Lovable export should go here:
frontend/
├── package.json       # From Lovable
├── src/
│   ├── App.jsx       # Your main component
│   ├── components/   # Your UI components
│   └── utils/
│       └── api.js    # Add API utilities (see INTEGRATION_EXAMPLE.md)
├── public/
└── index.html
```

### 3. Run Both Services

```bash
# Easy way - run both together
./run_local.sh

# Or manually:
# Terminal 1 - Backend
cd backend && python api.py

# Terminal 2 - Frontend  
cd frontend && npm install && npm start
```

## 🔌 API Endpoints Available

Your Lovable frontend can call these endpoints:

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/api/health` | GET | Health check | `fetch('/api/health')` |
| `/api/test-connection` | GET | Test DB connection | `fetch('/api/test-connection')` |
| `/api/query` | POST | Execute SQL | `fetch('/api/query', {method: 'POST', body: JSON.stringify({query: sql})})` |
| `/api/schema/:table` | GET | Get table schema | `fetch('/api/schema/samples.nyctaxi.trips')` |

## 📝 Integration Steps

### Step 1: Add API Utility to Lovable

Create `frontend/src/utils/api.js` (see `frontend/INTEGRATION_EXAMPLE.md`)

### Step 2: Update Your Components

Replace any hardcoded data with API calls:

```javascript
// Before (hardcoded)
const data = [{id: 1, name: 'test'}];

// After (from Databricks)
const data = await api.executeQuery('SELECT * FROM my_table');
```

### Step 3: Add Proxy Configuration

Add to `frontend/package.json`:

```json
{
  "proxy": "http://localhost:8001"
}
```

This allows `/api/*` calls to proxy to the backend.

### Step 4: Test Locally

```bash
./run_local.sh
```

Visit http://localhost:3000

## 🚢 Deployment to Databricks

### Before Deploying:

1. **Update `app.yaml`** - Uncomment the hybrid command:
   ```yaml
   command: ["sh", "-c", "cd backend && python api.py & cd frontend && npm start"]
   ```

2. **Test locally** with `./run_local.sh`

3. **Commit to GitHub**:
   ```bash
   git add frontend/
   git commit -m "Add Lovable frontend"
   git push
   ```

### Deploy:

1. Go to Databricks workspace (pm-bootcamp)
2. Find your `dasnav` app
3. Link to GitHub repo (already done)
4. Click **Deploy**
5. Select **main** branch

The app will build and deploy both frontend and backend!

## 🧪 Testing

### Test Backend API:
```bash
cd backend
python test_api.py
```

### Test Databricks Connection:
```bash
cd backend
python test_connection.py
```

### Test Frontend (after you add it):
```bash
cd frontend
npm test
```

## 🔧 Troubleshooting

### Backend won't start:
```bash
# Check .env exists
ls .env

# Check dependencies
pip install -r backend/requirements.txt

# Check auth
databricks auth token --profile pm-bootcamp
```

### Frontend can't connect to backend:
1. Check backend is running on port 8001
2. Check `proxy` in package.json
3. Check CORS is enabled (already configured in `backend/api.py`)

### CORS errors in browser:
Backend has CORS enabled for `localhost:3000`. If you use a different port, update `backend/api.py`:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:YOUR_PORT", "*"],
        # ...
    }
})
```

## 📚 Next Steps

1. ✅ Backend is ready
2. ⏳ Export your Lovable project
3. ⏳ Drop files into `frontend/`
4. ⏳ Integrate API calls (see `frontend/INTEGRATION_EXAMPLE.md`)
5. ⏳ Test locally
6. ⏳ Deploy to Databricks

## 💡 Pro Tips

- **Keep the Streamlit app** (`backend/app.py`) as a reference
- **Test API first** before building frontend
- **Use the example code** in `frontend/INTEGRATION_EXAMPLE.md`
- **Start simple** - get one query working, then expand
- **Check logs** - Backend logs show in terminal

## 🆘 Need Help?

Check these files:
- `frontend/README.md` - Frontend integration instructions
- `frontend/INTEGRATION_EXAMPLE.md` - React code examples
- `backend/test_api.py` - API testing examples
- `SECURITY.md` - Credential management
