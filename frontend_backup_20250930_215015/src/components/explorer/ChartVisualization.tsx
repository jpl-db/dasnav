import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LegendProps } from "recharts";
import { useMemo } from "react";
import TimeRangeSelector from "./TimeRangeSelector";
import { format } from "date-fns";
import { CHART_COLORS, formatValue, calculateNiceDomain } from "@/lib/chartUtils";
import LegendTable from "./legend/LegendTable";
import LegendList from "./legend/LegendList";
import { buildQuery } from "@/lib/queryBuilder";
import { useDatabricksQuery } from "@/hooks/useDatabricks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
}

interface ChartConfig {
  chartType: 'default' | 'period-over-period';
  grain: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: { column: string; aggregation: string; name: string; format: string; yAxis: 'left' | 'right' }[];
  filters: { column: string; operator: string; value: string }[];
  trailing: { unit: string; count: number } | null;
  popConfig: {
    metric: string;
    aggregation: string;
    name: string;
    format: string;
    yAxis: 'left' | 'right';
    compareUnit: 'day' | 'week' | 'month' | 'quarter' | 'year';
    compareCount: number;
  };
  dateRange: {
    start: Date | undefined;
    end: Date | undefined;
  };
  legendConfig: {
    show: boolean;
    position: 'top' | 'bottom' | 'right';
    layout: 'list' | 'table';
    showSummary: boolean;
    summaryTypes: ('total' | 'average' | 'min' | 'max' | 'first' | 'last' | 'current')[];
    hiddenSeries: string[];
  };
}

interface ChartVisualizationProps {
  table: string;
  schema: SchemaColumn[];
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}


const ChartVisualization = ({ table, schema, config, onConfigChange }: ChartVisualizationProps) => {
  // Build SQL query
  const sqlQuery = useMemo(() => {
    return buildQuery(table, schema, config);
  }, [table, schema, config]);

  // Fetch data from API
  const hasMetrics = config.chartType === 'period-over-period' || config.metrics.length > 0;
  const { data: queryResult, isLoading, error } = useDatabricksQuery(
    sqlQuery,
    hasMetrics && sqlQuery.length > 0
  );

  // Extract processed data and raw taxi data
  const rawData = queryResult?.data || [];
  const rawTaxiData = queryResult?.rawData || [];

  // Process data for visualization
  const aggregatedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // For period-over-period, data is already in the right format
    if (config.chartType === 'period-over-period') {
      return rawData.map(row => ({
        ...row,
        time: row.time || format(new Date(), 'MMM d, yyyy')
      }));
    }
    
    // For default charts, check if data has 'time' field (from backend) or needs aggregation
    const hasTimeField = rawData[0] && 'time' in rawData[0];
    
    if (hasTimeField) {
      // Data is already aggregated from backend, just format timestamps
      return rawData.map(row => ({
        ...row,
        time: row.time ? format(new Date(row.time), 'MMM d, yyyy') : 'N/A'
      }));
    } else {
      // Raw taxi data - need to aggregate it
      const timeColumn = schema.find(col => col.role === 'time')?.name || 'tpep_pickup_datetime';
      
      // Group by time grain
      const grouped = new Map<string, any>();
      
      rawData.forEach(row => {
        const timestamp = new Date(row[timeColumn]);
        let timeKey: string;
        
        // Truncate timestamp based on grain
        switch (config.grain) {
          case 'hour':
            timestamp.setMinutes(0, 0, 0);
            break;
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
          case 'quarter':
            const quarter = Math.floor(timestamp.getMonth() / 3);
            timestamp.setMonth(quarter * 3, 1);
            timestamp.setHours(0, 0, 0, 0);
            break;
          case 'year':
            timestamp.setMonth(0, 1);
            timestamp.setHours(0, 0, 0, 0);
            break;
        }
        
        timeKey = timestamp.toISOString();
        
        if (!grouped.has(timeKey)) {
          grouped.set(timeKey, {
            time: format(timestamp, 'MMM d, yyyy'),
            timestamp: timestamp,
            values: {}
          });
        }
        
        const entry = grouped.get(timeKey)!;
        
        // Aggregate metrics
        if (config.chartType === 'default') {
          config.metrics.forEach(metric => {
            const key = `${metric.aggregation}_${metric.column}`;
            const value = Number(row[metric.column]) || 0;
            
            if (!entry.values[key]) {
              entry.values[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
            }
            
            entry.values[key].sum += value;
            entry.values[key].count += 1;
            entry.values[key].min = Math.min(entry.values[key].min, value);
            entry.values[key].max = Math.max(entry.values[key].max, value);
          });
        }
      });
      
      // Convert to array and calculate final aggregations
      return Array.from(grouped.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(entry => {
          const result: any = { time: entry.time };
          
          Object.keys(entry.values).forEach(key => {
            const values = entry.values[key];
            const [agg] = key.split('_');
            
            switch (agg) {
              case 'sum':
                result[key] = values.sum;
                break;
              case 'avg':
                result[key] = values.sum / values.count;
                break;
              case 'count':
                result[key] = values.count;
                break;
              case 'min':
                result[key] = values.min;
                break;
              case 'max':
                result[key] = values.max;
                break;
            }
          });
          
          return result;
        });
    }
  }, [rawData, config.grain, config.chartType, config.metrics, schema]);

  // Toggle series visibility
  const toggleSeries = (seriesName: string) => {
    const isHidden = config.legendConfig.hiddenSeries.includes(seriesName);
    let newHiddenSeries: string[];

    if (isHidden) {
      // Show the series
      newHiddenSeries = config.legendConfig.hiddenSeries.filter(name => name !== seriesName);
    } else {
      // Hide the series - but ensure at least one series remains visible
      const allSeries = config.chartType === 'period-over-period'
        ? [`Current ${config.popConfig.name}`, `${config.popConfig.compareCount} ${config.popConfig.compareUnit}(s) ago`]
        : config.metrics.map(m => m.name);
      
      const visibleCount = allSeries.length - config.legendConfig.hiddenSeries.length;
      
      if (visibleCount > 1) {
        newHiddenSeries = [...config.legendConfig.hiddenSeries, seriesName];
      } else {
        // Don't allow hiding if it's the last visible series
        return;
      }
    }

    onConfigChange({
      ...config,
      legendConfig: {
        ...config.legendConfig,
        hiddenSeries: newHiddenSeries
      }
    });
  };

  // Custom Legend Component
  const CustomLegend = ({ payload }: LegendProps) => {
    if (!payload || !config.legendConfig.show) return null;

    if (config.legendConfig.layout === 'table') {
      return (
        <LegendTable
          payload={payload}
          aggregatedData={aggregatedData}
          rawData={rawTaxiData}
          chartType={config.chartType}
          metrics={config.metrics}
          popConfig={config.popConfig}
          legendConfig={config.legendConfig}
          onToggleSeries={toggleSeries}
        />
      );
    }

    return (
      <LegendList
        payload={payload}
        aggregatedData={aggregatedData}
        rawData={rawTaxiData}
        chartType={config.chartType}
        metrics={config.metrics}
        popConfig={config.popConfig}
        legendConfig={config.legendConfig}
        onToggleSeries={toggleSeries}
      />
    );
  };

  const hasRightAxis = config.chartType === 'default'
    ? config.metrics.some(m => m.yAxis === 'right')
    : config.popConfig.yAxis === 'right';
  
  const leftMetrics = config.chartType === 'default' ? config.metrics.filter(m => m.yAxis === 'left') : [];
  const rightMetrics = config.chartType === 'default' ? config.metrics.filter(m => m.yAxis === 'right') : [];

  // Calculate Y-axis domains based on visible series only
  const yAxisDomains = useMemo(() => {
    const getVisibleDataKeys = (yAxis: 'left' | 'right') => {
      if (config.chartType === 'period-over-period') {
        if (config.popConfig.yAxis !== yAxis) return [];
        const dataKey = `${config.popConfig.aggregation}_${config.popConfig.metric}`;
        const currentSeriesName = `Current ${config.popConfig.name}`;
        const previousSeriesName = `${config.popConfig.compareCount} ${config.popConfig.compareUnit}(s) ago`;
        
        const keys: string[] = [];
        if (!config.legendConfig.hiddenSeries.includes(currentSeriesName)) {
          keys.push(`current_${dataKey}`);
        }
        if (!config.legendConfig.hiddenSeries.includes(previousSeriesName)) {
          keys.push(`previous_${dataKey}`);
        }
        return keys;
      } else {
        return config.metrics
          .filter(m => m.yAxis === yAxis && !config.legendConfig.hiddenSeries.includes(m.name))
          .map(m => `${m.aggregation}_${m.column}`);
      }
    };

    const leftKeys = getVisibleDataKeys('left');
    const rightKeys = getVisibleDataKeys('right');

    return {
      left: calculateNiceDomain(leftKeys, aggregatedData),
      right: calculateNiceDomain(rightKeys, aggregatedData)
    };
  }, [aggregatedData, config.chartType, config.metrics, config.popConfig, config.legendConfig.hiddenSeries]);

  const renderLines = () => {
    if (config.chartType === 'period-over-period') {
      const dataKey = `${config.popConfig.aggregation}_${config.popConfig.metric}`;
      const currentSeriesName = `Current ${config.popConfig.name}`;
      const previousSeriesName = `${config.popConfig.compareCount} ${config.popConfig.compareUnit}(s) ago`;
      
      const isCurrentHidden = config.legendConfig.hiddenSeries.includes(currentSeriesName);
      const isPreviousHidden = config.legendConfig.hiddenSeries.includes(previousSeriesName);
      
      return (
        <>
          <Line
            type="monotone"
            dataKey={`current_${dataKey}`}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            strokeOpacity={isCurrentHidden ? 0 : 1}
            dot={isCurrentHidden ? false : { r: 2 }}
            activeDot={isCurrentHidden ? false : { r: 4 }}
            name={currentSeriesName}
            yAxisId={config.popConfig.yAxis}
          />
          <Line
            type="monotone"
            dataKey={`previous_${dataKey}`}
            stroke={CHART_COLORS[1]}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeOpacity={isPreviousHidden ? 0 : 1}
            dot={isPreviousHidden ? false : { r: 2 }}
            activeDot={isPreviousHidden ? false : { r: 4 }}
            name={previousSeriesName}
            yAxisId={config.popConfig.yAxis}
          />
        </>
      );
    } else {
      return config.metrics.map((metric, index) => {
        const dataKey = `${metric.aggregation}_${metric.column}`;
        const isHidden = config.legendConfig.hiddenSeries.includes(metric.name);
        
        return (
          <Line
            key={dataKey}
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            strokeOpacity={isHidden ? 0 : 1}
            dot={isHidden ? false : { r: 2 }}
            activeDot={isHidden ? false : { r: 4 }}
            name={metric.name}
            yAxisId={metric.yAxis}
          />
        );
      });
    }
  };

  if (!hasMetrics) {
    return (
      <Card className="flex h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Add a metric to visualize data</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex h-[400px] items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Query Error:</strong> {error.message}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!aggregatedData || aggregatedData.length === 0) {
    return (
      <Card className="flex h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available for the selected configuration</p>
        </div>
      </Card>
    );
  }

  const handleRangeChange = (start: Date | undefined, end: Date | undefined) => {
    onConfigChange({
      ...config,
      dateRange: { start, end }
    });
  };

  const handleGrainChange = (grain: ChartConfig['grain']) => {
    onConfigChange({ ...config, grain });
  };

  return (
    <Card className="p-6">
      {/* Time Range Selector */}
      <div className="mb-6 border-b border-border pb-4">
        <TimeRangeSelector
          startDate={config.dateRange.start}
          endDate={config.dateRange.end}
          grain={config.grain}
          onRangeChange={handleRangeChange}
          onGrainChange={handleGrainChange}
        />
      </div>

      {/* Chart Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {config.chartType === 'period-over-period' ? 'Period over Period' : 'Time Series'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {aggregatedData.length} data points | Grain: {config.grain}
          {config.chartType === 'period-over-period' && 
            ` | Comparing to ${config.popConfig.compareCount} ${config.popConfig.compareUnit}(s) ago`
          }
          {(config.dateRange.start || config.dateRange.end) && (
            <span className="ml-2">
              | Range: {config.dateRange.start ? format(config.dateRange.start, 'MMM d') : 'Start'} - {config.dateRange.end ? format(config.dateRange.end, 'MMM d, yyyy') : 'Now'}
            </span>
          )}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={aggregatedData} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey={config.chartType === 'period-over-period' ? 'time' : 'time'}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => {
              try {
                return format(new Date(value), 'MMM d');
              } catch {
                return value;
              }
            }}
          />
          <YAxis 
            yAxisId="left"
            className="text-xs"
            width={80}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            domain={yAxisDomains.left || ['auto', 'auto']}
            tickFormatter={(value: number) => {
              if (config.chartType === 'period-over-period' && config.popConfig.yAxis === 'left') {
                return formatValue(value, config.popConfig.format);
              }
              // Use the first left metric's format for left Y-axis
              if (config.chartType === 'default' && leftMetrics.length > 0) {
                return formatValue(value, leftMetrics[0].format);
              }
              return formatValue(value, 'number');
            }}
          />
          {hasRightAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              width={80}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={yAxisDomains.right || ['auto', 'auto']}
              tickFormatter={(value: number) => {
                if (config.chartType === 'period-over-period' && config.popConfig.yAxis === 'right') {
                  return formatValue(value, config.popConfig.format);
                }
                // Use the first right metric's format for right Y-axis
                if (rightMetrics.length > 0) {
                  return formatValue(value, rightMetrics[0].format);
                }
                return formatValue(value, 'number');
              }}
            />
          )}
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            formatter={(value: number, name: string) => {
              // Find the metric config for this data series
              if (config.chartType === 'default') {
                const metric = config.metrics.find(m => m.name === name);
                if (metric) {
                  return [formatValue(value, metric.format), name];
                }
              } else if (config.chartType === 'period-over-period') {
                return [formatValue(value, config.popConfig.format), name];
              }
              return [formatValue(value, 'number'), name];
            }}
          />
          <Legend content={<CustomLegend />} />
          {renderLines()}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ChartVisualization;