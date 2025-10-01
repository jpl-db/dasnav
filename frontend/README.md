# Unity Catalog Explorer - Frontend

**Lovable App**: https://github.com/jpl-db/uc-glimpse  
**Backend API**: https://dasnav-3755057911985085.staging.aws.databricksapps.com/api  
**Deployment Repo**: https://github.com/jpl-db/dasnav

---

## 🎯 Architecture

This React frontend calls a **deployed Databricks backend** for all data operations.

```
Lovable UI (local dev)
    ↓
Calls deployed Databricks API
    ↓
https://dasnav-3755057911985085.staging.aws.databricksapps.com/api
```

**No local backend needed for UI development!** ✨

---

## 🚀 Quick Start

### **Option 1: Develop in Lovable (Recommended)**
1. Open your Lovable project
2. Make UI changes
3. Preview instantly - calls deployed Databricks API automatically
4. That's it!

### **Option 2: Run Locally**
```bash
npm install
npm run dev
# Opens on http://localhost:8080
# Calls deployed Databricks backend
```

---

## 🔌 API Configuration

The API base URL is configured in `src/lib/databricksApi.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 
  'https://dasnav-3755057911985085.staging.aws.databricksapps.com/api';
```

### **Default (Production)**:
- Calls deployed Databricks app
- No configuration needed!

### **Override for Local Backend Testing**:
Create `.env.local`:
```bash
VITE_API_URL=http://localhost:8001/api
```

---

## 📡 Available API Endpoints

### **Health Check**
```typescript
GET /api/health
Response: { status: "ok", service: "databricks-query-api", profile: string }
```

### **Test Connection**
```typescript
GET /api/test-connection
Response: { status: "success", message: string }
```

### **Execute SQL Query**
```typescript
POST /api/query
Body: { query: string }
Response: { status: "success", data: Array<Object>, row_count: number, columns: string[] }
```

### **Get Table Schema**
```typescript
GET /api/schema/:table_name
Response: { status: "success", table: string, schema: Array<{ col_name: string, data_type: string }> }
```

---

## 🛠️ Development Workflow

### **1. Working in Lovable**
```
Edit UI in Lovable
    ↓
Preview in Lovable (calls deployed API)
    ↓
Lovable auto-commits to uc-glimpse repo
    ↓
Done!
```

### **2. Deploying Changes**
When your UI is ready for production:

```bash
# In the dasnav repo (not this one)
./import_lovable.sh https://github.com/jpl-db/uc-glimpse
git add frontend/
git commit -m "Update UI from Lovable"
git push

# Then in Databricks UI: Click Deploy
```

---

## 📁 Key Files

```
frontend/
├── src/
│   ├── lib/
│   │   └── databricksApi.ts     # API client (calls deployed backend)
│   ├── hooks/
│   │   └── useDatabricks.ts     # React hooks for API calls
│   ├── components/
│   │   └── explorer/            # UI components
│   └── pages/
│       └── Index.tsx            # Main page
│
├── vite.config.ts               # No proxy needed!
├── package.json
└── README.md                    # This file
```

---

## 🎨 Using the API in Components

### **Import the hooks**:
```typescript
import { useDatabricksSchema, useDatabricksQuery } from '@/hooks/useDatabricks';
```

### **Fetch table schema**:
```typescript
const { data: schema, isLoading, error } = useDatabricksSchema('samples.nyctaxi.trips');
```

### **Execute queries**:
```typescript
const { data: results, isLoading, error } = useDatabricksQuery(
  'SELECT * FROM samples.nyctaxi.trips LIMIT 10'
);
```

### **Example Component**:
```typescript
import { useDatabricksSchema } from '@/hooks/useDatabricks';

export function SchemaViewer({ tableName }: { tableName: string }) {
  const { data: schema, isLoading, error } = useDatabricksSchema(tableName);

  if (isLoading) return <div>Loading schema...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {schema.schema.map(col => (
        <div key={col.col_name}>
          {col.col_name}: {col.data_type}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### **API calls failing?**
1. Check that the backend is deployed: https://dasnav-3755057911985085.staging.aws.databricksapps.com/api/health
2. Check browser console for CORS errors
3. Verify `VITE_API_URL` if using local override

### **Running locally but API not responding?**
If you've set `VITE_API_URL` to `localhost:8001`:
1. Make sure the backend is running: `cd ../backend && python api.py`
2. Check backend logs for errors
3. Default is deployed backend - just remove `.env.local` to use it!

---

## 🌐 Deployment

This frontend is deployed as part of the Databricks app.

**Deployed URL**: https://dasnav-3755057911985085.staging.aws.databricksapps.com

The deployment process:
1. Databricks runs `npm install && npm run build`
2. Serves the built `dist/` folder
3. Flask backend serves the frontend + handles `/api` routes

---

## 💡 Tips for Lovable Development

1. **Mock mode is disabled** - All API calls go to real backend
2. **Backend is always available** - Deployed at Databricks
3. **No CORS issues in Lovable** - Backend allows all origins
4. **Fast iteration** - Just code in Lovable and see results!

---

## 🔗 Related Documentation

- **Backend API Spec**: See `../LOVABLE_API_SPEC.md`
- **Simple Workflow**: See `../SIMPLE_WORKFLOW.md`
- **Deployment Guide**: See `../DEPLOYMENT.md`

---

**Questions?** Check the parent repo docs or the Databricks Apps documentation!