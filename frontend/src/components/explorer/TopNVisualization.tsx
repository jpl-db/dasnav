import { useMemo, useState, useEffect } from "react";
import { Loader2, X, Filter, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { buildTopNQuery } from "@/lib/queryBuilder";
import { useDatabricksQuery } from "@/hooks/useDatabricks";

interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
  includeInTopN?: boolean;
}

interface TopNConfig {
  dimension: string;
  metric: string;
  aggregation: string;
  limit: number;
}

interface TopNVisualizationProps {
  table: string;
  schema: SchemaColumn[];
  metrics: { column: string; aggregation: string; name: string }[];
  dateRange: { start: Date | undefined; end: Date | undefined };
  onFilterChange?: (filters: { column: string; operator: string; value: string }[]) => void;
  activeFilters?: { column: string; operator: string; value: string }[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))',
];

const TopNVisualization = ({ 
  table, 
  schema, 
  metrics, 
  dateRange,
  onFilterChange,
  activeFilters = []
}: TopNVisualizationProps) => {
  const dimensions = useMemo(() => 
    schema.filter(col => col.role === 'dimension'),
    [schema]
  );

  const topNEnabledDimensions = useMemo(() => 
    dimensions.filter(col => col.includeInTopN),
    [dimensions]
  );

  const defaultConfig = useMemo(() => {
    const defaultMetric = metrics[0];
    const defaultDimension = topNEnabledDimensions[0] || dimensions[0];
    
    return {
      dimension: defaultDimension?.name || '',
      metric: defaultMetric?.column || '',
      aggregation: defaultMetric?.aggregation || 'sum',
      limit: 10
    };
  }, [topNEnabledDimensions, dimensions, metrics]);

  const [config, setConfig] = useState<TopNConfig>(defaultConfig);
  const [secondaryDimension, setSecondaryDimension] = useState<string>('');
  const [clickedValue, setClickedValue] = useState<string | null>(null);

  useEffect(() => {
    setConfig(defaultConfig);
  }, [defaultConfig]);

  const sqlQuery = useMemo(() => {
    if (!config.dimension || !config.metric) return '';
    return buildTopNQuery(
      table,
      schema,
      config.dimension,
      config.metric,
      config.aggregation,
      config.limit,
      dateRange,
      activeFilters,
      secondaryDimension || undefined
    );
  }, [table, schema, config, dateRange, activeFilters, secondaryDimension]);

  const { data, isLoading, error } = useDatabricksQuery(sqlQuery, sqlQuery.length > 0);

  const chartData: { data: any[]; total: number; uniqueSecondary: string[] } = useMemo(() => {
    if (!data || !Array.isArray(data)) return { data: [], total: 0, uniqueSecondary: [] };
    const valueKey = `${config.aggregation}_${config.metric}`;
    
    if (secondaryDimension) {
      // Group data by primary dimension and stack by secondary
      const grouped = data.reduce((acc: any, row: any) => {
        const primary = String(row[config.dimension] || 'Unknown');
        const secondary = String(row[secondaryDimension] || 'Other');
        const value = Number(row[valueKey]) || 0;
        
        if (!acc[primary]) {
          acc[primary] = { name: primary, total: 0 };
        }
        acc[primary][secondary] = (acc[primary][secondary] || 0) + value;
        acc[primary].total += value;
        return acc;
      }, {});
      
      const uniqueSecondary = [...new Set(data.map((row: any) => String(row[secondaryDimension] || 'Other')))];
      const chartDataArray = Object.values(grouped).sort((a: any, b: any) => b.total - a.total);
      const total: number = chartDataArray.reduce<number>((sum, item: any) => sum + (item.total || 0), 0);
      
      return { data: chartDataArray, total, uniqueSecondary };
    } else {
      const chartDataArray = data.map((row: any) => ({
        name: String(row[config.dimension] || 'Unknown'),
        value: Number(row[valueKey]) || 0
      }));
      const total: number = chartDataArray.reduce<number>((sum, item) => sum + (item.value || 0), 0);
      return { data: chartDataArray, total, uniqueSecondary: [] };
    }
  }, [data, config, secondaryDimension]);

  const handleBarClick = (data: any) => {
    if (!onFilterChange || !data?.name) return;
    
    const filterValue = data.name;
    const existingFilter = activeFilters.find(f => f.column === config.dimension);
    
    if (existingFilter && existingFilter.value === filterValue) {
      // Remove filter if clicking same value
      setClickedValue(null);
      onFilterChange(activeFilters.filter(f => f.column !== config.dimension));
    } else {
      // Add or update filter
      setClickedValue(filterValue);
      const newFilters = activeFilters.filter(f => f.column !== config.dimension);
      newFilters.push({
        column: config.dimension,
        operator: '=',
        value: filterValue
      });
      onFilterChange(newFilters);
    }
  };

  const clearFilter = () => {
    setClickedValue(null);
    if (onFilterChange) {
      onFilterChange(activeFilters.filter(f => f.column !== config.dimension));
    }
  };

  const activeFilterForThisDimension = activeFilters.find(f => f.column === config.dimension);

  const hasRequiredData = topNEnabledDimensions.length > 0 && metrics.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>Top N Analysis</CardTitle>
              {activeFilterForThisDimension && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {config.dimension} = {activeFilterForThisDimension.value}
                  <button onClick={clearFilter} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            {hasRequiredData && (
              <p className="text-sm text-muted-foreground">
                Click on a bar to filter the main chart by that value
              </p>
            )}
          </div>
          {hasRequiredData && (
            <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Label htmlFor="dimension-select" className="text-sm whitespace-nowrap">Primary:</Label>
              <Select value={config.dimension} onValueChange={(value) => {
                setConfig(prev => ({ ...prev, dimension: value }));
                clearFilter();
              }}>
                <SelectTrigger id="dimension-select" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topNEnabledDimensions.length > 0 ? (
                    topNEnabledDimensions.map(dim => (
                      <SelectItem key={dim.name} value={dim.name}>
                        {dim.name}
                      </SelectItem>
                    ))
                  ) : (
                    dimensions.map(dim => (
                      <SelectItem key={dim.name} value={dim.name}>
                        {dim.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="secondary-select" className="text-sm whitespace-nowrap">Group by:</Label>
              <Select value={secondaryDimension} onValueChange={setSecondaryDimension}>
                <SelectTrigger id="secondary-select" className="w-[140px]">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {dimensions.filter(d => d.name !== config.dimension).map(dim => (
                    <SelectItem key={dim.name} value={dim.name}>
                      {dim.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="metric-select" className="text-sm">Metric:</Label>
              <Select 
                value={`${config.aggregation}_${config.metric}`}
                onValueChange={(value) => {
                  const [agg, ...metricParts] = value.split('_');
                  const metricName = metricParts.join('_');
                  setConfig(prev => ({ ...prev, aggregation: agg, metric: metricName }));
                }}
              >
                <SelectTrigger id="metric-select" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(m => (
                    <SelectItem key={`${m.aggregation}_${m.column}`} value={`${m.aggregation}_${m.column}`}>
                      {m.name || `${m.aggregation}(${m.column})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="limit-input" className="text-sm">Top N:</Label>
              <Input
                id="limit-input"
                type="number"
                min={1}
                max={50}
                value={config.limit}
                onChange={(e) => setConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                className="w-[80px]"
              />
            </div>
          </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasRequiredData && (
          <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
            <div className="text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Enable Top N Analysis</p>
              <p className="text-sm mt-2 max-w-md">
                Go to the <strong>Schema</strong> tab and check the dimensions you want to analyze in the "Top N Analysis" section
              </p>
            </div>
          </div>
        )}
        
        {hasRequiredData && (
          <>
        {isLoading && (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-[400px] text-destructive">
            Error loading data: {error.message}
          </div>
        )}
        
        {!isLoading && !error && chartData.data.length === 0 && (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available
          </div>
        )}
        
        {!isLoading && !error && chartData.data.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={chartData.data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={(e) => e?.activePayload?.[0] && handleBarClick(e.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number) => {
                  const percentage = chartData.total > 0 ? ((value / chartData.total) * 100).toFixed(1) : '0';
                  return [`${value.toLocaleString()} (${percentage}%)`, ''];
                }}
              />
              {secondaryDimension ? (
                <>
                  <Legend />
                  {chartData.uniqueSecondary.map((secondary, index) => (
                    <Bar 
                      key={secondary} 
                      dataKey={secondary} 
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]}
                      radius={index === chartData.uniqueSecondary.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      cursor="pointer"
                    />
                  ))}
                </>
              ) : (
                <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
                  {chartData.data.map((entry: any, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === clickedValue ? 'hsl(var(--primary))' : COLORS[index % COLORS.length]}
                      opacity={clickedValue && entry.name !== clickedValue ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopNVisualization;