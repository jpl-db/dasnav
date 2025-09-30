# Frontend - Lovable Integration

## 📦 Drop Your Lovable Export Here

This directory is where your Lovable.dev React app should go.

### Steps to Integrate:

1. **Export from Lovable:**
   - Go to your Lovable project
   - Export/download your project files
   
2. **Place Files Here:**
   ```
   frontend/
   ├── package.json       # From your Lovable export
   ├── src/               # Your React components
   ├── public/            # Static assets
   ├── index.html         # Main HTML file
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
