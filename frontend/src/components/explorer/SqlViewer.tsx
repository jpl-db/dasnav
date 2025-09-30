import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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

interface SqlViewerProps {
  table: string;
  schema: SchemaColumn[];
  config: ChartConfig;
}

const SqlViewer = ({ table, schema, config }: SqlViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSQL = () => {
    const timeColumn = schema.find(col => col.role === 'time')?.name || 'timestamp';
    
    if (config.chartType === 'period-over-period') {
      const metric = config.popConfig;
      const offsetMap: Record<string, string> = {
        day: 'DAY',
        week: 'WEEK',
        month: 'MONTH',
        quarter: 'QUARTER',
        year: 'YEAR'
      };
      const offsetUnit = offsetMap[metric.compareUnit];
      
      return `-- Period over Period Comparison
WITH current_period AS (
  SELECT
    DATE_TRUNC('${config.grain}', ${timeColumn}) as time_bucket,
    ${metric.aggregation.toUpperCase()}(${metric.metric}) as value
  FROM ${table}
  WHERE ${timeColumn} >= DATEADD(${offsetUnit}, -${metric.compareCount}, CURRENT_DATE())
  GROUP BY time_bucket
),
previous_period AS (
  SELECT
    DATE_TRUNC('${config.grain}', ${timeColumn}) as time_bucket,
    ${metric.aggregation.toUpperCase()}(${metric.metric}) as value
  FROM ${table}
  WHERE ${timeColumn} >= DATEADD(${offsetUnit}, -${metric.compareCount * 2}, CURRENT_DATE())
    AND ${timeColumn} < DATEADD(${offsetUnit}, -${metric.compareCount}, CURRENT_DATE())
  GROUP BY time_bucket
)
SELECT 
  c.time_bucket,
  c.value as current_value,
  p.value as previous_value,
  ((c.value - p.value) / NULLIF(p.value, 0)) * 100 as pct_change
FROM current_period c
LEFT JOIN previous_period p ON c.time_bucket = p.time_bucket
ORDER BY c.time_bucket DESC;`;
    } else {
      const metricExpressions = config.metrics.length > 0
        ? config.metrics.map(m => {
            const alias = m.name.toLowerCase().replace(/\s+/g, '_');
            return `  ${m.aggregation.toUpperCase()}(${m.column}) as ${alias}`;
          }).join(',\n')
        : '  COUNT(*) as count';

      return `SELECT
  DATE_TRUNC('${config.grain}', ${timeColumn}) as time_bucket,
${metricExpressions}
FROM ${table}
GROUP BY time_bucket
ORDER BY time_bucket DESC
LIMIT 1000;`;
    }
  };

  const sql = generateSQL();

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard");
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Generated SQL</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="rounded-md bg-muted p-4">
        <pre className="text-xs text-foreground overflow-x-auto">
          <code>{sql}</code>
        </pre>
      </div>
    </Card>
  );
};

export default SqlViewer;