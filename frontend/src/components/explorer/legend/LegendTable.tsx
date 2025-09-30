import { Badge } from "@/components/ui/badge";
import { formatValue, calculateSummary, getSummaryLabel, SummaryType } from "@/lib/chartUtils";

interface LegendTableProps {
  payload: any[];
  aggregatedData: any[];
  chartType: 'default' | 'period-over-period';
  metrics: any[];
  popConfig: any;
  legendConfig: {
    showSummary: boolean;
    summaryTypes: SummaryType[];
    hiddenSeries: string[];
  };
  onToggleSeries: (seriesName: string) => void;
}

const LegendTable = ({
  payload,
  aggregatedData,
  chartType,
  metrics,
  popConfig,
  legendConfig,
  onToggleSeries
}: LegendTableProps) => {
  return (
    <div className="px-4 py-2">
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Series</th>
              {legendConfig.showSummary && legendConfig.summaryTypes.map(type => (
                <th key={type} className="text-right px-3 py-2 font-medium">
                  {getSummaryLabel(type)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.map((entry: any, index: number) => {
              const isHidden = legendConfig.hiddenSeries.includes(entry.value);
              const dataKey = entry.dataKey;
              
              let metricFormat = 'number';
              if (chartType === 'period-over-period') {
                metricFormat = popConfig.format;
              } else {
                const metric = metrics.find(m => m.name === entry.value);
                if (metric) metricFormat = metric.format;
              }

              const summaries = legendConfig.showSummary
                ? legendConfig.summaryTypes.map(type => ({
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
                  onClick={() => onToggleSeries(entry.value)}
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
};

export default LegendTable;
