import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimeRangeSelectorProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  grain: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  onGrainChange: (grain: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}

const TimeRangeSelector = ({ startDate, endDate, grain, onRangeChange, onGrainChange }: TimeRangeSelectorProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(endDate);

  const presets = [
    {
      label: "Last 7 days",
      getValue: () => ({
        start: subDays(new Date(), 7),
        end: new Date(),
      }),
    },
    {
      label: "Last 14 days",
      getValue: () => ({
        start: subDays(new Date(), 14),
        end: new Date(),
      }),
    },
    {
      label: "Last 28 days",
      getValue: () => ({
        start: subDays(new Date(), 28),
        end: new Date(),
      }),
    },
    {
      label: "Last 90 days",
      getValue: () => ({
        start: subDays(new Date(), 90),
        end: new Date(),
      }),
    },
    {
      label: "This month",
      getValue: () => ({
        start: startOfMonth(new Date()),
        end: new Date(),
      }),
    },
    {
      label: "Last month",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      },
    },
    {
      label: "All time",
      getValue: () => ({
        start: undefined,
        end: undefined,
      }),
    },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    setCustomStartDate(start);
    setCustomEndDate(end);
    onRangeChange(start, end);
    setIsMenuOpen(false);
  };

  const handleCustomApply = () => {
    onRangeChange(customStartDate, customEndDate);
    setIsMenuOpen(false);
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) return "All time";
    if (startDate && endDate) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    }
    if (startDate) return `From ${format(startDate, "MMM d, yyyy")}`;
    if (endDate) return `Until ${format(endDate, "MMM d, yyyy")}`;
    return "Select date range";
  };

  return (
    <div className="space-y-3">
      {/* Time Range Menu */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Time Range</Label>
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal"
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {getDisplayText()}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3">
              {/* Preset Options */}
              <div className="space-y-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="w-full justify-start text-sm font-normal"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <Separator className="my-3" />

              {/* Custom Range */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Custom Range</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      disabled={(date) => date > new Date()}
                      className="pointer-events-auto rounded-md border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">End Date</Label>
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => {
                        if (date > new Date()) return true;
                        if (customStartDate && date < customStartDate) return true;
                        return false;
                      }}
                      className="pointer-events-auto rounded-md border"
                    />
                  </div>
                  <Button
                    onClick={handleCustomApply}
                    className="w-full"
                    size="sm"
                  >
                    Apply Custom Range
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Grain */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Time Grain</Label>
        <Select value={grain} onValueChange={onGrainChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Hour</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimeRangeSelector;