/**
 * React hooks for Databricks API operations
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import databricksApi, { type QueryResult } from '@/lib/databricksApi';

/**
 * Hook to test Databricks connection
 */
export function useConnectionTest() {
  return useQuery({
    queryKey: ['databricks', 'connection'],
    queryFn: () => databricksApi.testConnection(),
    retry: 1,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get table schema
 */
export function useTableSchema(tableName: string | null) {
  return useQuery({
    queryKey: ['databricks', 'schema', tableName],
    queryFn: () => databricksApi.getTableSchema(tableName!),
    enabled: !!tableName,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook to execute SQL queries
 */
export function useExecuteQuery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sql: string) => databricksApi.executeQuery(sql),
    onSuccess: () => {
      // Invalidate and refetch any queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['databricks', 'query'] });
    },
  });
}

/**
 * Hook to query a specific table
 */
export function useQueryTable(tableName: string | null, limit: number = 1000) {
  return useQuery({
    queryKey: ['databricks', 'table', tableName, limit],
    queryFn: () => databricksApi.queryTable(tableName!, limit),
    enabled: !!tableName,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get timeseries data
 */
export function useTimeseriesData(
  tableName: string | null,
  timestampColumn: string | null,
  metricColumns: string[],
  limit: number = 10000
) {
  return useQuery({
    queryKey: ['databricks', 'timeseries', tableName, timestampColumn, metricColumns, limit],
    queryFn: () => 
      databricksApi.getTimeseriesData(tableName!, timestampColumn!, metricColumns, limit),
    enabled: !!tableName && !!timestampColumn && metricColumns.length > 0,
    staleTime: 60000, // 1 minute
  });
}
