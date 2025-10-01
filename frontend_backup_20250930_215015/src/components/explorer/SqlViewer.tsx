import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { buildQuery } from "@/lib/queryBuilder";
import { useMemo } from "react";

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
  const sql = useMemo(() => {
    return buildQuery(table, schema, config);
  }, [table, schema, config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard");
  };

  if (!sql || sql.trim().length === 0) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Generated SQL</h2>
        </div>
        <div className="rounded-md bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground">Configure metrics to generate SQL</p>
        </div>
      </Card>
    );
  }

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