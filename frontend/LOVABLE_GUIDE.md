# 🎨 Lovable Development Guide

**For AI assistants and developers working in Lovable**

---

## 🎯 What You Need to Know

### **The Backend API is Already Deployed**
```
https://dasnav-3755057911985085.staging.aws.databricksapps.com/api
```

You **don't need to run any backend locally**. Just build the UI!

---

## 🔌 API Integration

### **API Client is Already Configured**
Location: `src/lib/databricksApi.ts`

```typescript
// Already configured to call deployed backend!
const API_BASE = 'https://dasnav-3755057911985085.staging.aws.databricksapps.com/api';
```

### **React Hooks are Ready to Use**
Location: `src/hooks/useDatabricks.ts`

**IMPORTANT**: `MOCK_MODE` is set to `false` - all calls go to the real backend!

```typescript
const MOCK_MODE = false;  // ← Uses real Databricks backend
```

---

## 📋 Available API Functions

### **From `src/lib/databricksApi.ts`**:

```typescript
// Execute SQL query
await runQuery("SELECT * FROM samples.nyctaxi.trips LIMIT 10");

// Get table schema
await getTableSchema("samples.nyctaxi.trips");

// Test connection
await testBackendConnection();

// Get backend health
await getBackendHealth();
```

### **React Hooks** (from `src/hooks/useDatabricks.ts`):

```typescript
// Query hook
const { data, isLoading, error } = useDatabricksQuery(sqlQuery);

// Schema hook
const { data: schema } = useDatabricksSchema("samples.nyctaxi.trips");

// Health check hook
const { data: health } = useBackendHealth();

// Connection test hook
const { data: test } = useBackendConnectionTest();
```

---

## 🎯 Common Patterns

### **Pattern 1: Fetch and Display Schema**
```typescript
import { useDatabricksSchema } from '@/hooks/useDatabricks';

export function TableSchema({ tableName }: { tableName: string }) {
  const { data, isLoading, error } = useDatabricksSchema(tableName);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data?.schema) return null;

  return (
    <div>
      <h3>Schema for {tableName}</h3>
      {data.schema.map(col => (
        <div key={col.col_name}>
          <strong>{col.col_name}</strong>: {col.data_type}
        </div>
      ))}
    </div>
  );
}
```

### **Pattern 2: Execute Query and Show Results**
```typescript
import { useDatabricksQuery } from '@/hooks/useDatabricks';

export function QueryResults({ query }: { query: string }) {
  const { data, isLoading, error } = useDatabricksQuery(query);

  if (isLoading) return <div>Running query...</div>;
  if (error) return <div>Query failed: {error.message}</div>;
  if (!data?.data) return null;

  return (
    <div>
      <p>Rows: {data.row_count}</p>
      <table>
        <thead>
          <tr>
            {data.columns.map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.data.map((row, i) => (
            <tr key={i}>
              {data.columns.map(col => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📊 API Response Formats

### **Schema Response**:
```typescript
{
  status: "success",
  table: "samples.nyctaxi.trips",
  schema: [
    { col_name: "tpep_pickup_datetime", data_type: "timestamp" },
    { col_name: "trip_distance", data_type: "double" },
    { col_name: "fare_amount", data_type: "double" },
    // ...
  ]
}
```

### **Query Response**:
```typescript
{
  status: "success",
  row_count: 10,
  columns: ["tpep_pickup_datetime", "trip_distance", "fare_amount"],
  data: [
    { 
      tpep_pickup_datetime: "2016-02-14T16:52:13.000+0000",
      trip_distance: 1.1,
      fare_amount: 7.0
    },
    // ... more rows
  ]
}
```

### **Error Response**:
```typescript
{
  status: "error",
  message: "Failed to get schema for invalid.table: Error message here"
}
```

---

## 🧪 Testing Your Changes

### **In Lovable Preview**:
1. Make UI changes
2. Preview automatically calls the deployed API
3. Test with real data from Unity Catalog!

**Example test query**:
```sql
SELECT * FROM samples.nyctaxi.trips LIMIT 5
```

**Example test table**:
```
samples.nyctaxi.trips
```

---

## ⚠️ Important Notes

### **DO NOT**:
- ❌ Change `MOCK_MODE` to `true` (breaks real API calls)
- ❌ Hardcode API URLs (use the configured `API_BASE`)
- ❌ Try to run a local backend (not needed!)

### **DO**:
- ✅ Use the provided React hooks
- ✅ Handle loading and error states
- ✅ Test with `samples.nyctaxi.trips` table
- ✅ Check browser console for API errors

---

## 🎨 UI Components Available

The app uses **shadcn/ui** components. Available in `src/components/ui/`:

- `<Button>`, `<Input>`, `<Select>`
- `<Table>`, `<Card>`, `<Tabs>`
- `<Dialog>`, `<Sheet>`, `<Popover>`
- `<Toast>`, `<Sonner>` (for notifications)
- Many more...

**Plus custom components** in `src/components/explorer/`:
- `<SchemaInference>` - Auto-infer schema from table name
- `<ChartBuilder>` - Build charts from data
- `<TimeRangeSelector>` - Date/time range picker
- `<SqlViewer>` - Display generated SQL

---

## 🔧 Debugging

### **Check Backend Health**:
```typescript
const { data } = useBackendHealth();
console.log(data); // { status: "ok", service: "databricks-query-api", ... }
```

### **Test Connection**:
```typescript
const { data } = useBackendConnectionTest();
console.log(data); // { status: "success", message: "..." }
```

### **View API Calls**:
Open browser DevTools → Network tab → Filter by "api"

---

## 📦 Dependencies

All necessary packages are installed:
- `@tanstack/react-query` - Data fetching and caching
- `lucide-react` - Icons
- `recharts` - Charts
- `date-fns` - Date utilities
- `shadcn/ui` - UI components

---

## 🌟 Quick Wins

Want to add a feature? Here are some ideas:

1. **Add a table picker** - Let users select from available tables
2. **Query history** - Store recent queries in localStorage
3. **Export results** - Download query results as CSV
4. **Chart builder** - Visualize query results
5. **Schema browser** - Browse all Unity Catalog schemas

All the backend infrastructure is ready - just build the UI!

---

## 🔗 Need More Info?

- **Backend API docs**: `../LOVABLE_API_SPEC.md`
- **Full API reference**: Test endpoints at https://dasnav-3755057911985085.staging.aws.databricksapps.com/api/health
- **Parent repo**: https://github.com/jpl-db/dasnav

---

**Happy building! The backend is ready and waiting for your beautiful UI!** ✨
