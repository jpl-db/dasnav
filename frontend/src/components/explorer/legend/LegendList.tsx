import { Badge } from "@/components/ui/badge";
import { formatValue, calculateSummary, getSummaryLabel, SummaryType } from "@/lib/chartUtils";

interface LegendListProps {
  payload: any[];
  aggregatedData: any[];
  chartType: 'default' | 'period-over-period';
  metrics: any[];
  popConfig: any;
  legendConfig: {
    position: 'top' | 'bottom' | 'right';
    showSummary: boolean;
    summaryTypes: SummaryType[];
    hiddenSeries: string[];
  };
  onToggleSeries: (seriesName: string) => void;
}

const LegendList = ({
  payload,
  aggregatedData,
  chartType,
  metrics,
  popConfig,
  legendConfig,
  onToggleSeries
}: LegendListProps) => {
  const layoutClass = ['top', 'bottom'].includes(legendConfig.position)
    ? 'flex-row flex-wrap'
    : 'flex-col';

  return (
    <div className={`flex ${layoutClass} gap-4 px-4 py-2`}>
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
          <div
            key={`legend-${index}`}
            className={`flex flex-wrap items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
              isHidden ? 'opacity-50' : 'opacity-100'
            }`}
            onClick={() => onToggleSeries(entry.value)}
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
            {legendConfig.showSummary && summaries.length > 0 && (
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

export default LegendList;
