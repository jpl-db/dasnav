import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import SchemaInference from "@/components/explorer/SchemaInference";
import ChartBuilder from "@/components/explorer/ChartBuilder";
import ChartVisualization from "@/components/explorer/ChartVisualization";
import SqlViewer from "@/components/explorer/SqlViewer";
import DataConfig from "@/components/explorer/DataConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatabricksSchema } from "@/hooks/useDatabricks";
import { useToast } from "@/hooks/use-toast";
interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
}

const inferColumnRole = (name: string, type: string): SchemaColumn['role'] => {
  const lowerName = name.toLowerCase();
  const upperType = type.toUpperCase();
  
  // Time columns
  if (lowerName.includes('time') || lowerName.includes('date') || 
      upperType.includes('TIMESTAMP') || upperType.includes('DATE')) {
    return 'time';
  }
  
  // Metric columns (numeric types)
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || 
      upperType.includes('FLOAT') || upperType.includes('DOUBLE') || 
      upperType.includes('NUMERIC')) {
    return 'metric';
  }
  
  // Dimension columns (strings, etc.)
  if (upperType.includes('STRING') || upperType.includes('VARCHAR') || 
      upperType.includes('CHAR')) {
    return 'dimension';
  }
  
  return 'unassigned';
};

const Index = () => {
  const { toast } = useToast();
  const [tableName, setTableName] = useState<string>("samples.nyctaxi.trips");
  const [schema, setSchema] = useState<SchemaColumn[]>([]);
  
  // Fetch schema from backend
  const { 
    data: rawSchema, 
    isLoading: schemaLoading, 
    error: schemaError,
    refetch: refetchSchema 
  } = useDatabricksSchema(tableName, tableName.trim().length > 0);

  // Update schema when raw schema changes (use useEffect to avoid infinite re-renders)
  useEffect(() => {
    if (rawSchema && rawSchema.length > 0) {
      const schemaWithRoles = rawSchema.map(col => ({
        ...col,
        role: inferColumnRole(col.name, col.type)
      }));
      setSchema(schemaWithRoles);
    }
  }, [rawSchema]);

  // Show error toast (use useEffect to avoid infinite re-renders)
  useEffect(() => {
    if (schemaError) {
      toast({
        title: "Schema Fetch Error",
        description: schemaError.message,
        variant: "destructive",
      });
    }
  }, [schemaError, toast]);

  const handleRefreshSchema = () => {
    setSchema([]);
    refetchSchema();
  };
  const [chartConfig, setChartConfig] = useState({
    chartType: 'default' as 'default' | 'period-over-period',
    grain: 'day' as 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    metrics: [{
      column: 'revenue',
      aggregation: 'sum',
      name: 'Revenue',
      format: 'currency',
      yAxis: 'left' as 'left' | 'right',
    }] as {
      column: string;
      aggregation: string;
      name: string;
      format: string;
      yAxis: 'left' | 'right';
    }[],
    filters: [] as {
      column: string;
      operator: string;
      value: string;
    }[],
    trailing: null as {
      unit: string;
      count: number;
    } | null,
    popConfig: {
      metric: 'revenue',
      aggregation: 'sum',
      name: 'Revenue',
      format: 'currency',
      yAxis: 'left' as 'left' | 'right',
      compareUnit: 'month' as 'day' | 'week' | 'month' | 'quarter' | 'year',
      compareCount: 1
    },
    dateRange: {
      start: undefined as Date | undefined,
      end: undefined as Date | undefined
    },
    legendConfig: {
      show: true,
      position: 'bottom' as 'top' | 'bottom' | 'right',
      layout: 'list' as 'list' | 'table',
      showSummary: false,
      summaryTypes: ['total'] as ('total' | 'average' | 'min' | 'max' | 'first' | 'last' | 'current')[],
      hiddenSeries: [] as string[],
    },
  });
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Unity Catalog Explorer</h1>
                <p className="text-sm text-muted-foreground">Interactive time-series analysis & visualization</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Current Table</p>
              <p className="text-sm font-mono font-semibold text-foreground">{tableName}</p>
              <p className="text-xs text-muted-foreground">
                {schema.length > 0 ? `${schema.length} columns` : schemaLoading ? 'Loading...' : 'No schema'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Sidebar - Controls */}
          <Tabs defaultValue="data-config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data-config">Data</TabsTrigger>
              <TabsTrigger value="schema-roles">Schema</TabsTrigger>
              <TabsTrigger value="chart-builder">Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="data-config" className="space-y-4">
              <DataConfig
                tableName={tableName}
                onTableNameChange={setTableName}
                onRefresh={handleRefreshSchema}
                isLoading={schemaLoading}
              />
            </TabsContent>
            <TabsContent value="schema-roles" className="space-y-4">
              <SchemaInference schema={schema} onSchemaUpdate={setSchema} />
            </TabsContent>
            <TabsContent value="chart-builder" className="space-y-4">
              <ChartBuilder schema={schema} config={chartConfig} onConfigChange={setChartConfig} />
            </TabsContent>
          </Tabs>

          {/* Right Main Area - Visualization */}
          <div className="space-y-4">
            <ChartVisualization 
              table={tableName} 
              schema={schema} 
              config={chartConfig} 
              onConfigChange={setChartConfig} 
            />
            <SqlViewer table={tableName} schema={schema} config={chartConfig} />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;