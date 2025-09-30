import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, BarChart3, List, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

interface ChartBuilderProps {
  schema: SchemaColumn[];
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

const generateMetricName = (column: string, aggregation: string): string => {
  const cleanColumn = column
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const aggMap: Record<string, string> = {
    sum: 'Total',
    count: 'Count of',
    avg: 'Average',
    min: 'Minimum',
    max: 'Maximum',
  };
  
  const prefix = aggMap[aggregation] || aggregation.toUpperCase();
  
  // For sum, just return the column name (e.g., "Revenue" instead of "Total Revenue")
  if (aggregation === 'sum') {
    return cleanColumn;
  }
  
  return `${prefix} ${cleanColumn}`;
};

const ChartBuilder = ({ schema, config, onConfigChange }: ChartBuilderProps) => {
  const metricColumns = schema.filter(col => col.role === 'metric');

  const addMetric = () => {
    if (metricColumns.length === 0) return;
    const column = metricColumns[0].name;
    const aggregation = 'sum';
    onConfigChange({
      ...config,
      metrics: [
        ...config.metrics,
        { 
          column, 
          aggregation,
          name: generateMetricName(column, aggregation),
          format: 'number',
          yAxis: 'left',
        }
      ]
    });
  };

  const updateMetric = (index: number, field: 'column' | 'aggregation' | 'name' | 'format' | 'yAxis', value: string) => {
    const newMetrics = [...config.metrics];
    const updatedMetric = { ...newMetrics[index], [field]: value };
    
    // Auto-regenerate name if column or aggregation changes
    if (field === 'column' || field === 'aggregation') {
      updatedMetric.name = generateMetricName(
        field === 'column' ? value : updatedMetric.column,
        field === 'aggregation' ? value : updatedMetric.aggregation
      );
    }
    
    newMetrics[index] = updatedMetric;
    onConfigChange({ ...config, metrics: newMetrics });
  };

  const removeMetric = (index: number) => {
    const newMetrics = config.metrics.filter((_, i) => i !== index);
    onConfigChange({ ...config, metrics: newMetrics });
  };

  const handleChartTypeChange = (chartType: ChartConfig['chartType']) => {
    onConfigChange({ ...config, chartType });
  };

  const handlePopConfigChange = (field: string, value: any) => {
    const updatedConfig = { ...config.popConfig, [field]: value };
    
    // Auto-regenerate name if column or aggregation changes
    if (field === 'metric' || field === 'aggregation') {
      updatedConfig.name = generateMetricName(
        field === 'metric' ? value : updatedConfig.metric,
        field === 'aggregation' ? value : updatedConfig.aggregation
      );
    }
    
    onConfigChange({
      ...config,
      popConfig: updatedConfig
    });
  };

  const handleLegendConfigChange = (field: string, value: any) => {
    onConfigChange({
      ...config,
      legendConfig: { ...config.legendConfig, [field]: value }
    });
  };

  const addSummaryType = () => {
    const availableTypes: ('total' | 'average' | 'min' | 'max' | 'first' | 'last' | 'current')[] = 
      ['total', 'average', 'min', 'max', 'first', 'last', 'current'];
    
    const unusedTypes = availableTypes.filter(type => 
      !config.legendConfig.summaryTypes.includes(type)
    );
    
    if (unusedTypes.length > 0) {
      handleLegendConfigChange('summaryTypes', [
        ...config.legendConfig.summaryTypes,
        unusedTypes[0]
      ]);
    }
  };

  const removeSummaryType = (index: number) => {
    const newTypes = [...config.legendConfig.summaryTypes];
    newTypes.splice(index, 1);
    handleLegendConfigChange('summaryTypes', newTypes);
  };

  const updateSummaryType = (index: number, value: string) => {
    const newTypes = [...config.legendConfig.summaryTypes];
    newTypes[index] = value as any;
    handleLegendConfigChange('summaryTypes', newTypes);
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground">Chart Builder</h2>
      </div>

      <div className="space-y-4">
        {/* Chart Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Chart Type</Label>
          <Select value={config.chartType} onValueChange={handleChartTypeChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Multi-metric)</SelectItem>
              <SelectItem value="period-over-period">Period over Period</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        {/* Conditional rendering based on chart type */}
        {config.chartType === 'default' ? (
          /* Default: Multiple Metrics */
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Metrics</Label>
            {config.metrics.length === 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={addMetric}
                className="w-full h-9"
                disabled={metricColumns.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Metric
              </Button>
            ) : (
              <div className="space-y-3">
                {config.metrics.map((metric, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Metric {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMetric(index)}
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={metric.aggregation}
                        onValueChange={(value) => updateMetric(index, 'aggregation', value)}
                      >
                        <SelectTrigger className="h-9 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="count">COUNT</SelectItem>
                          <SelectItem value="sum">SUM</SelectItem>
                          <SelectItem value="avg">AVG</SelectItem>
                          <SelectItem value="min">MIN</SelectItem>
                          <SelectItem value="max">MAX</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={metric.column}
                        onValueChange={(value) => updateMetric(index, 'column', value)}
                      >
                        <SelectTrigger className="h-9 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {metricColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Display Name</Label>
                      <Input
                        type="text"
                        value={metric.name}
                        onChange={(e) => updateMetric(index, 'name', e.target.value)}
                        className="mt-1 h-9"
                        placeholder="Enter metric name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Format</Label>
                        <Select
                          value={metric.format}
                          onValueChange={(value) => updateMetric(index, 'format', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="decimal">Decimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Y-Axis</Label>
                        <Select
                          value={metric.yAxis}
                          onValueChange={(value) => updateMetric(index, 'yAxis', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                {config.metrics.length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMetric}
                    className="w-full h-8"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Another
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Period over Period Configuration */
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Compare Metric</Label>
            
            <div className="flex gap-2">
              <Select
                value={config.popConfig.aggregation}
                onValueChange={(value) => handlePopConfigChange('aggregation', value)}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">COUNT</SelectItem>
                  <SelectItem value="sum">SUM</SelectItem>
                  <SelectItem value="avg">AVG</SelectItem>
                  <SelectItem value="min">MIN</SelectItem>
                  <SelectItem value="max">MAX</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={config.popConfig.metric}
                onValueChange={(value) => handlePopConfigChange('metric', value)}
              >
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                type="text"
                value={config.popConfig.name}
                onChange={(e) => handlePopConfigChange('name', e.target.value)}
                className="mt-1 h-9"
                placeholder="Enter metric name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Format</Label>
                <Select
                  value={config.popConfig.format}
                  onValueChange={(value) => handlePopConfigChange('format', value)}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Y-Axis</Label>
                <Select
                  value={config.popConfig.yAxis}
                  onValueChange={(value) => handlePopConfigChange('yAxis', value)}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Compare To</Label>
              <div className="flex gap-2">
                <Select
                  value={config.popConfig.compareCount.toString()}
                  onValueChange={(value) => handlePopConfigChange('compareCount', parseInt(value))}
                >
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={config.popConfig.compareUnit}
                  onValueChange={(value) => handlePopConfigChange('compareUnit', value)}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day(s) Ago</SelectItem>
                    <SelectItem value="week">Week(s) Ago</SelectItem>
                    <SelectItem value="month">Month(s) Ago</SelectItem>
                    <SelectItem value="quarter">Quarter(s) Ago</SelectItem>
                    <SelectItem value="year">Year(s) Ago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Legend Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-primary" />
            <Label className="text-xs font-medium text-muted-foreground">Legend</Label>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Show Legend</Label>
            <Switch
              checked={config.legendConfig.show}
              onCheckedChange={(checked) => handleLegendConfigChange('show', checked)}
            />
          </div>

          {config.legendConfig.show && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <Select
                    value={config.legendConfig.position}
                    onValueChange={(value) => handleLegendConfigChange('position', value)}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Layout</Label>
                  <Select
                    value={config.legendConfig.layout}
                    onValueChange={(value) => handleLegendConfigChange('layout', value)}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Summary Metrics</Label>
                <Switch
                  checked={config.legendConfig.showSummary}
                  onCheckedChange={(checked) => handleLegendConfigChange('showSummary', checked)}
                />
              </div>

              {config.legendConfig.showSummary && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Summary Types</Label>
                  {config.legendConfig.summaryTypes.map((type, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={type}
                        onValueChange={(value) => updateSummaryType(index, value)}
                      >
                        <SelectTrigger className="h-9 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Total</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="min">Min</SelectItem>
                          <SelectItem value="max">Max</SelectItem>
                          <SelectItem value="first">First</SelectItem>
                          <SelectItem value="last">Last</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => removeSummaryType(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {config.legendConfig.summaryTypes.length < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSummaryType}
                      className="w-full h-8"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Summary Type
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ChartBuilder;