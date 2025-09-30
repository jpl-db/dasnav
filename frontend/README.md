# Frontend - Lovable Integration

## 🎯 Recommended Setup: Separate Repositories

**Keep your Lovable project in its own repo** to avoid conflicts:

```
lovable-dasnav-ui/     ← Lovable manages this repo
└── Your Lovable UI

dasnav/frontend/       ← Copy here when ready to integrate
└── Lovable UI + API integration
```

### Why Separate Repos?
- ✅ Lovable can auto-commit without conflicts
- ✅ Cursor/you edit backend without touching Lovable
- ✅ Clean separation of concerns
- ✅ Copy to dasnav only when UI is ready

## 📋 Integration Steps

### Step 1: Let Lovable Create Its Repo
1. In Lovable: Settings → GitHub
2. Create new repo (e.g., `lovable-dasnav-ui`)
3. Let Lovable manage that repo

### Step 2: When Ready, Copy to dasnav

```bash
# Clone your Lovable repo
cd ~/code
git clone https://github.com/YOUR-USERNAME/lovable-dasnav-ui.git

# Copy to this directory
cd ~/code/dasnav/frontend
cp -r ~/code/lovable-dasnav-ui/* .
```

### Step 3: Add API Integration

Place files here:
```
frontend/
├── package.json       # From Lovable (add proxy config)
├── src/               # Your React components
│   └── utils/
│       └── api.js    # Add this for backend calls
├── public/            # Static assets
└── ...                # Other Lovable files
```

3. **Update API Calls:**
   Your Lovable components will call the backend API at `/api/*` endpoints:
   
   ```javascript
   // Example: Execute a query
   const runQuery = async (sql) => {
     const response = await fetch('/api/query', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ query: sql })
     });
     const result = await response.json();
     return result.data;
   };
   ```

4. **Available API Endpoints:**
   - `GET /api/health` - Health check
   - `GET /api/test-connection` - Test DB connection
   - `POST /api/query` - Execute SQL query
   - `GET /api/schema/:table_name` - Get table schema

### Local Development:

Once you've dropped your Lovable code here:

```bash
# Install dependencies
cd frontend
npm install

# Run frontend (typically on port 3000)
npm start
```

The backend API will run on port 8001, and your frontend will proxy requests to it.

### Example Integration:

See `INTEGRATION_EXAMPLE.md` for sample React code showing how to call the backend APIs.
