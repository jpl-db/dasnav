import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LegendProps } from "recharts";
import { aggregateData, aggregateDataPoP, TimeSeriesRow } from "@/lib/mockData";
import { useMemo } from "react";
import TimeRangeSelector from "./TimeRangeSelector";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  mockData: TimeSeriesRow[];
  onConfigChange: (config: ChartConfig) => void;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const formatValue = (value: number, format: string): string => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    
    case 'percent':
      return `${value.toFixed(2)}%`;
    
    case 'short':
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);
    
    case 'decimal':
      return value.toFixed(2);
    
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
  }
};

type SummaryType = 'total' | 'average' | 'min' | 'max' | 'first' | 'last' | 'current';

const calculateSummary = (data: any[], dataKey: string, summaryType: SummaryType): number => {
  const values = data.map(d => d[dataKey]).filter(v => v !== null && v !== undefined);
  
  if (values.length === 0) return 0;
  
  switch (summaryType) {
    case 'total':
      return values.reduce((sum, val) => sum + val, 0);
    case 'average':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'first':
      return values[0];
    case 'last':
      return values[values.length - 1];
    case 'current':
      return values[values.length - 1]; // Same as last for now
    default:
      return 0;
  }
};

const getSummaryLabel = (type: SummaryType): string => {
  const labels: Record<SummaryType, string> = {
    total: 'Total',
    average: 'Avg',
    min: 'Min',
    max: 'Max',
    first: 'First',
    last: 'Last',
    current: 'Current'
  };
  return labels[type];
};

const ChartVisualization = ({ table, schema, config, mockData, onConfigChange }: ChartVisualizationProps) => {
  // Filter data by date range first
  const filteredData = useMemo(() => {
    if (!config.dateRange.start && !config.dateRange.end) return mockData;
    
    return mockData.filter(row => {
      const rowDate = new Date(row.event_timestamp);
      if (config.dateRange.start && rowDate < config.dateRange.start) return false;
      if (config.dateRange.end && rowDate > config.dateRange.end) return false;
      return true;
    });
  }, [mockData, config.dateRange]);

  const aggregatedData = useMemo(() => {
    if (config.chartType === 'period-over-period') {
      return aggregateDataPoP(
        filteredData,
        config.grain,
        { column: config.popConfig.metric, aggregation: config.popConfig.aggregation },
        config.popConfig.compareUnit,
        config.popConfig.compareCount
      );
    } else {
      if (config.metrics.length === 0) return [];
      return aggregateData(filteredData, config.grain, config.metrics);
    }
  }, [filteredData, config]);

  const hasMetrics = config.chartType === 'period-over-period' || config.metrics.length > 0;

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
        <div className="px-4 py-2">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Series</th>
                  {config.legendConfig.showSummary && config.legendConfig.summaryTypes.map(type => (
                    <th key={type} className="text-right px-3 py-2 font-medium">
                      {getSummaryLabel(type)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.map((entry: any, index: number) => {
                  const isHidden = config.legendConfig.hiddenSeries.includes(entry.value);
                  const dataKey = entry.dataKey;
                  
                  let metricFormat = 'number';
                  if (config.chartType === 'period-over-period') {
                    metricFormat = config.popConfig.format;
                  } else {
                    const metric = config.metrics.find(m => m.name === entry.value);
                    if (metric) metricFormat = metric.format;
                  }

                  const summaries = config.legendConfig.showSummary
                    ? config.legendConfig.summaryTypes.map(type => ({
                        type,
                        value: calculateSummary(aggregatedData, dataKey, type),
                        label: getSummaryLabel(type)
                      }))
                    : [];

                  return (
                    <tr
                      key={`legend-${index}`}
                      className={`cursor-pointer transition-all duration-200 hover:bg-muted/30 border-t border-border ${
                        isHidden ? 'opacity-50' : 'opacity-100'
                      }`}
                      onClick={() => toggleSeries(entry.value)}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className={`font-medium ${isHidden ? 'line-through' : ''}`}>
                            {entry.value}
                          </span>
                        </div>
                      </td>
                      {summaries.map((summary, idx) => (
                        <td key={idx} className="text-right px-3 py-2 font-mono text-xs">
                          {formatValue(summary.value, metricFormat)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // List layout (default)
    const layoutClass = ['top', 'bottom'].includes(config.legendConfig.position)
      ? 'flex-row flex-wrap'
      : 'flex-col';

    return (
      <div className={`flex ${layoutClass} gap-4 px-4 py-2`}>
        {payload.map((entry: any, index: number) => {
          const isHidden = config.legendConfig.hiddenSeries.includes(entry.value);
          const dataKey = entry.dataKey;
          
          let metricFormat = 'number';
          if (config.chartType === 'period-over-period') {
            metricFormat = config.popConfig.format;
          } else {
            const metric = config.metrics.find(m => m.name === entry.value);
            if (metric) metricFormat = metric.format;
          }

          const summaries = config.legendConfig.showSummary
            ? config.legendConfig.summaryTypes.map(type => ({
                type,
                value: calculateSummary(aggregatedData, dataKey, type),
                label: getSummaryLabel(type)
              }))
            : [];

          return (
            <div
              key={`legend-${index}`}
              className={`flex flex-wrap items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                isHidden ? 'opacity-50' : 'opacity-100'
              }`}
              onClick={() => toggleSeries(entry.value)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-sm font-medium ${isHidden ? 'line-through' : ''}`}>
                  {entry.value}
                </span>
              </div>
              {config.legendConfig.showSummary && summaries.length > 0 && (
                <>
                  {summaries.map((summary, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {summary.label}: {formatValue(summary.value, metricFormat)}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
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

    const calculateDomain = (dataKeys: string[]): [number, number] | undefined => {
      if (dataKeys.length === 0) return undefined;
      
      let min = Infinity;
      let max = -Infinity;
      
      aggregatedData.forEach(row => {
        dataKeys.forEach(key => {
          const value = row[key];
          if (value !== null && value !== undefined && !isNaN(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        });
      });
      
      if (min === Infinity || max === -Infinity) return undefined;
      
      // Add 10% padding to the domain
      const padding = (max - min) * 0.1;
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    };

    const leftKeys = getVisibleDataKeys('left');
    const rightKeys = getVisibleDataKeys('right');

    return {
      left: calculateDomain(leftKeys),
      right: calculateDomain(rightKeys)
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
            dataKey={config.chartType === 'period-over-period' ? 'index' : 'time'}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
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