import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import SchemaInference from "@/components/explorer/SchemaInference";
import ChartBuilder from "@/components/explorer/ChartBuilder";
import ChartVisualization from "@/components/explorer/ChartVisualization";
import SqlViewer from "@/components/explorer/SqlViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateTimeSeriesData } from "@/lib/mockData";
interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
}
const MOCK_SCHEMA: SchemaColumn[] = [{
  name: 'event_timestamp',
  type: 'TIMESTAMP',
  role: 'time'
}, {
  name: 'user_id',
  type: 'STRING',
  role: 'dimension'
}, {
  name: 'event_type',
  type: 'STRING',
  role: 'dimension'
}, {
  name: 'revenue',
  type: 'DECIMAL',
  role: 'metric'
}, {
  name: 'quantity',
  type: 'INTEGER',
  role: 'metric'
}, {
  name: 'session_duration_ms',
  type: 'BIGINT',
  role: 'metric'
}, {
  name: 'country',
  type: 'STRING',
  role: 'dimension'
}, {
  name: 'device_type',
  type: 'STRING',
  role: 'dimension'
}];
const Index = () => {
  const [selectedTable] = useState<string>("analytics.events.user_events");
  const [schema, setSchema] = useState<SchemaColumn[]>(MOCK_SCHEMA);
  const [mockData] = useState(() => generateTimeSeriesData(180)); // 6 months of data
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
                <p className="text-sm text-muted-foreground">Interactive time-series analysis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Connected to</p>
              <p className="text-sm font-semibold text-foreground">{selectedTable}</p>
              <p className="text-xs text-muted-foreground">{mockData.length.toLocaleString()} rows</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Sidebar - Controls */}
          <Tabs defaultValue="chart-builder" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart-builder">Chart Builder</TabsTrigger>
              <TabsTrigger value="schema-roles">Data config</TabsTrigger>
            </TabsList>
            <TabsContent value="chart-builder" className="space-y-4">
              <ChartBuilder schema={schema} config={chartConfig} onConfigChange={setChartConfig} />
            </TabsContent>
            <TabsContent value="schema-roles" className="space-y-4">
              <SchemaInference schema={schema} onSchemaUpdate={setSchema} />
            </TabsContent>
          </Tabs>

          {/* Right Main Area - Visualization */}
          <div className="space-y-4">
            <ChartVisualization table={selectedTable} schema={schema} config={chartConfig} mockData={mockData} onConfigChange={setChartConfig} />
            <SqlViewer table={selectedTable} schema={schema} config={chartConfig} />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;