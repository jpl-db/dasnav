# Integration Example: Calling Backend APIs from Lovable React

## Example Component Using Backend API

```javascript
import React, { useState } from 'react';

function QueryRunner() {
  const [query, setQuery] = useState('SELECT * FROM samples.nyctaxi.trips LIMIT 10');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setResults(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-runner">
      <h2>SQL Query Runner</h2>
      
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={5}
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
      
      <button 
        onClick={executeQuery} 
        disabled={loading}
      >
        {loading ? 'Running...' : 'Execute Query'}
      </button>
      
      {error && (
        <div style={{ color: 'red' }}>
          Error: {error}
        </div>
      )}
      
      {results && (
        <div>
          <h3>Results ({results.length} rows)</h3>
          <table>
            <thead>
              <tr>
                {Object.keys(results[0] || {}).map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QueryRunner;
```

## API Utility Functions

Create a `src/utils/api.js` file in your Lovable project:

```javascript
const API_BASE = '/api';

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  // Test database connection
  async testConnection() {
    const response = await fetch(`${API_BASE}/test-connection`);
    return response.json();
  },

  // Execute SQL query
  async executeQuery(sql) {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message);
    }
    
    return data.data;
  },

  // Get table schema
  async getTableSchema(tableName) {
    const response = await fetch(`${API_BASE}/schema/${tableName}`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message);
    }
    
    return data.schema;
  }
};
```

## Usage in Your Components

```javascript
import { api } from './utils/api';

// In your component
const loadData = async () => {
  try {
    const data = await api.executeQuery(
      'SELECT * FROM samples.nyctaxi.trips LIMIT 100'
    );
    setTableData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};
```

## Proxy Configuration for Local Dev

Add this to your Lovable `package.json`:

```json
{
  "proxy": "http://localhost:8001"
}
```

This allows your frontend (on port 3000) to call `/api/*` which will proxy to the backend on port 8001.
