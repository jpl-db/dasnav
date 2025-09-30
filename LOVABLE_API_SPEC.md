# Backend API Specification for Lovable

**Copy this prompt into Lovable when working on the UI:**

---

## 🔌 Backend API Endpoints

My app has a Python Flask backend running at `/api` with these endpoints:

### 1. Health Check
```typescript
GET /api/health
Response: { status: "ok", service: "databricks-query-api", profile: string }
```

### 2. Test Connection
```typescript
GET /api/test-connection
Response: { status: "success", message: string }
Error: { status: "error", message: string }
```

### 3. Execute SQL Query
```typescript
POST /api/query
Body: { query: string }
Response: Array<{ [column: string]: any }>  // Array of row objects
Error: { status: "error", message: string }
```

### 4. Get Table Schema
```typescript
GET /api/schema/:table_name
Response: Array<{ name: string, type: string }>
Error: { status: "error", message: string }
```

---

## 📋 Integration Requirements

Please create a TypeScript API client in `src/lib/databricksApi.ts` with these functions:

```typescript
export const runQuery = async (query: string): Promise<any[]>
export const getTableSchema = async (tableName: string): Promise<SchemaColumn[]>
export const testBackendConnection = async (): Promise<{ status: string; message?: string }>
export const getBackendHealth = async (): Promise<{ status: string; service: string; profile: string }>
```

And React hooks in `src/hooks/useDatabricks.ts`:

```typescript
export const useDatabricksQuery = (query: string, enabled?: boolean)
export const useDatabricksSchema = (tableName: string, enabled?: boolean)
export const useBackendHealth = ()
export const useBackendConnectionTest = ()
```

Use `@tanstack/react-query` for data fetching and caching.

---

## 🎯 App Functionality

The app should:
1. Let users input a Unity Catalog table name (default: `samples.nyctaxi.trips`)
2. Display the table schema (columns and types)
3. Allow users to write custom SQL queries
4. Show query results in a table
5. Visualize timeseries data with charts

---

## 🚀 Example Usage

```typescript
import { runQuery, getTableSchema } from '@/lib/databricksApi';
import { useDatabricksQuery } from '@/hooks/useDatabricks';

// In a component:
const { data, isLoading, error } = useDatabricksQuery(
  "SELECT * FROM samples.nyctaxi.trips LIMIT 10",
  true
);
```

---

**Copy everything above into Lovable when asking it to build features!**
