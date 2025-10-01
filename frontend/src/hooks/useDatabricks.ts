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
import { processPeriodOverPeriod } from '@/lib/periodOverPeriod';

// Mock mode configuration
// - In Lovable: Use mock data for fast UI iteration
// - Locally with backend: Set VITE_USE_MOCK=false or just start the backend
// - Auto-detect: If VITE_USE_MOCK is not set, default to true (mock mode)
const MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Process mock data to match SQL query structure
 */
const processMockDataForQuery = (rawData: any[], query: string): any[] => {
  // Check if this is a period over period query
  const isPoP = query.includes('current_period') && query.includes('previous_period');
  
  if (isPoP) {
    // Extract parameters from query
    const aggMatch = query.match(/\s+(\w+)\(/i);
    const metricMatch = query.match(/\((\w+)\)\s+AS\s+current_/);
    const grainMatch = query.match(/DATE_TRUNC\('(\w+)',/);
    const timeColMatch = query.match(/DATE_TRUNC\([^,]+,\s*(\w+)\)/);
    const intervalMatch = query.match(/INTERVAL\s+'(\d+)'\s+(\w+)/);
    
    if (!aggMatch || !metricMatch || !grainMatch || !timeColMatch || !intervalMatch) {
      console.error('[Mock PoP] Failed to parse query parameters');
      return [];
    }
    
    const aggregation = aggMatch[1].toLowerCase();
    const metric = metricMatch[1];
    const grain = grainMatch[1];
    const timeColumn = timeColMatch[1];
    const compareCount = parseInt(intervalMatch[1]);
    const compareUnit = intervalMatch[2].toLowerCase();
    
    console.log('[Mock PoP] Extracted params:', {
      aggregation,
      metric,
      grain,
      timeColumn,
      compareCount,
      compareUnit
    });
    
    // Process using the dedicated PoP function
    const processed = processPeriodOverPeriod(rawData, timeColumn, metric, {
      metric,
      aggregation: aggregation as any,
      compareUnit: compareUnit as any,
      compareCount,
      grain: grain as any
    });
    
    // Convert to expected format with proper column names
    return processed.map(row => ({
      time: row.time,
      [`current_${aggregation}_${metric}`]: row.current_value,
      [`previous_${aggregation}_${metric}`]: row.previous_value
    }));
  }
  
  // For non-PoP queries, return raw data (will be aggregated by ChartVisualization)
  return rawData;
};

/**
 * Execute a Databricks SQL query with React Query
 * Returns both raw data and processed data for chart visualization
 */
export const useDatabricksQuery = (
  query: string,
  enabled: boolean = true
): UseQueryResult<{ data: any[], rawData: any[] }, Error> => {
  return useQuery({
    queryKey: ['databricks-query', query],
    queryFn: async () => {
      if (MOCK_MODE) {
        console.log('[Mock Mode] Simulating query execution:', query);
        await new Promise(resolve => setTimeout(resolve, 500));
        const rawTaxiData = generateDefaultTaxiDataset();
        const processedData = processMockDataForQuery(rawTaxiData, query);
        return { data: processedData, rawData: rawTaxiData };
      }
      const data = await runQuery(query);
      return { data, rawData: data };
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
