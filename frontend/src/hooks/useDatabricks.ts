import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  runQuery,
  getTableSchema,
  testBackendConnection,
  getBackendHealth,
  SchemaColumn,
  BackendHealth,
  ConnectionTestResult,
} from '@/lib/databricksApi';
import { generateDefaultTaxiDataset, TAXI_SCHEMA } from '@/lib/mockNycTaxiData';

// Check if we're in mock mode (backend not available)
// Set to false to use the real Databricks backend
const MOCK_MODE = false;

/**
 * Process mock data to match SQL query structure
 */
const processMockDataForQuery = (rawData: any[], query: string): any[] => {
  // Check if this is a period over period query
  const isPoP = query.includes('current_period') && query.includes('previous_period');
  
  console.log('[Mock Data Processing] Is PoP:', isPoP);
  
  if (isPoP) {
    // Extract metric info from query
    const currentMatch = query.match(/current_(\w+)_(\w+)/);
    const previousMatch = query.match(/previous_(\w+)_(\w+)/);
    const grainMatch = query.match(/DATE_TRUNC\('(\w+)',/);
    const intervalMatch = query.match(/INTERVAL '(\d+)' (\w+)/);
    
    console.log('[Mock Data Processing] Matches:', { currentMatch, previousMatch, grainMatch, intervalMatch });
    
    if (!currentMatch || !previousMatch || !grainMatch || !intervalMatch) {
      console.log('[Mock Data Processing] Missing matches, returning empty');
      return [];
    }
    
    const agg = currentMatch[1];
    const metric = currentMatch[2];
    const grain = grainMatch[1];
    const compareCount = parseInt(intervalMatch[1]);
    const compareUnit = intervalMatch[2].toLowerCase();
    
    console.log('[Mock Data Processing] Params:', { agg, metric, grain, compareCount, compareUnit });
    
    // Group data by time grain
    const grouped = new Map<string, { current: number[]; previous: number[] }>();
    
    rawData.forEach(row => {
      const timestamp = new Date(row.tpep_pickup_datetime || row.tpep_dropoff_datetime);
      const value = Number(row[metric]) || 0;
      
      // Truncate timestamp based on grain
      switch (grain) {
        case 'day':
          timestamp.setHours(0, 0, 0, 0);
          break;
        case 'week':
          const day = timestamp.getDay();
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(0, 0, 0, 0);
          break;
        case 'month':
          timestamp.setDate(1);
          timestamp.setHours(0, 0, 0, 0);
          break;
      }
      
      const timeKey = timestamp.toISOString();
      
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, { current: [], previous: [] });
      }
      
      grouped.get(timeKey)!.current.push(value);
    });
    
    console.log('[Mock Data Processing] Grouped keys count:', grouped.size);
    
    // Calculate aggregations and shift data for previous period
    const result: any[] = [];
    const sortedKeys = Array.from(grouped.keys()).sort();
    
    sortedKeys.forEach((timeKey, index) => {
      const timestamp = new Date(timeKey);
      const entry = grouped.get(timeKey)!;
      
      // Calculate current value
      let currentValue = 0;
      if (agg === 'sum') {
        currentValue = entry.current.reduce((a, b) => a + b, 0);
      } else if (agg === 'avg') {
        currentValue = entry.current.reduce((a, b) => a + b, 0) / entry.current.length;
      } else if (agg === 'count') {
        currentValue = entry.current.length;
      }
      
      // Find previous period data
      let previousValue = null;
      const previousDate = new Date(timestamp);
      
      if (compareUnit === 'month') {
        previousDate.setMonth(previousDate.getMonth() - compareCount);
      } else if (compareUnit === 'week') {
        previousDate.setDate(previousDate.getDate() - (compareCount * 7));
      } else if (compareUnit === 'day') {
        previousDate.setDate(previousDate.getDate() - compareCount);
      }
      
      const previousKey = previousDate.toISOString();
      if (grouped.has(previousKey)) {
        const prevEntry = grouped.get(previousKey)!;
        if (agg === 'sum') {
          previousValue = prevEntry.current.reduce((a, b) => a + b, 0);
        } else if (agg === 'avg') {
          previousValue = prevEntry.current.reduce((a, b) => a + b, 0) / prevEntry.current.length;
        } else if (agg === 'count') {
          previousValue = prevEntry.current.length;
        }
      }
      
      result.push({
        time: timestamp.toISOString(),
        index: index,  // Add index for PoP X-axis
        [`current_${agg}_${metric}`]: currentValue,
        [`previous_${agg}_${metric}`]: previousValue,
      });
    });
    
    console.log('[Mock Data Processing] PoP Result count:', result.length);
    console.log('[Mock Data Processing] First result:', result[0]);
    
    return result;
  }
  
  // For non-PoP queries, return raw data (will be aggregated by ChartVisualization)
  console.log('[Mock Data Processing] Returning raw data, count:', rawData.length);
  return rawData;
};

/**
 * Execute a Databricks SQL query with React Query
 */
export const useDatabricksQuery = (
  query: string,
  enabled: boolean = true
): UseQueryResult<any[], Error> => {
  return useQuery({
    queryKey: ['databricks-query', query],
    queryFn: async () => {
      if (MOCK_MODE) {
        console.log('[Mock Mode] Simulating query execution:', query);
        await new Promise(resolve => setTimeout(resolve, 500));
        const rawData = generateDefaultTaxiDataset();
        return processMockDataForQuery(rawData, query);
      }
      return runQuery(query);
    },
    enabled: enabled && query.trim().length > 0,
    retry: 1,
    staleTime: 0,
  });
};

/**
 * Get table schema from Databricks
 */
export const useDatabricksSchema = (
  tableName: string,
  enabled: boolean = true
): UseQueryResult<SchemaColumn[], Error> => {
  return useQuery({
    queryKey: ['databricks-schema', tableName],
    queryFn: async () => {
      if (MOCK_MODE) {
        // In mock mode, return taxi schema if querying samples.nyctaxi.trips
        console.log('[Mock Mode] Returning mock schema for:', tableName);
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        
        if (tableName.toLowerCase().includes('nyctaxi') || tableName.toLowerCase().includes('trips')) {
          return TAXI_SCHEMA;
        }
        
        // Return empty schema for other tables
        throw new Error(`Mock data only available for samples.nyctaxi.trips`);
      }
      return getTableSchema(tableName);
    },
    enabled: enabled && tableName.trim().length > 0,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get backend health status
 */
export const useBackendHealth = (): UseQueryResult<BackendHealth, Error> => {
  return useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      if (MOCK_MODE) {
        console.log('[Mock Mode] Returning mock health status');
        return {
          status: 'ok',
          service: 'mock-databricks-api',
          profile: 'development',
        };
      }
      return getBackendHealth();
    },
    retry: 2,
    refetchInterval: 30000,
  });
};

/**
 * Test backend connection
 */
export const useBackendConnectionTest = (): UseQueryResult<ConnectionTestResult, Error> => {
  return useQuery({
    queryKey: ['backend-connection-test'],
    queryFn: async () => {
      if (MOCK_MODE) {
        console.log('[Mock Mode] Connection test (mock)');
        return {
          status: 'success' as const,
          message: 'Mock mode: Using generated NYC taxi data',
        };
      }
      return testBackendConnection();
    },
    retry: 1,
    staleTime: 10000,
  });
};
