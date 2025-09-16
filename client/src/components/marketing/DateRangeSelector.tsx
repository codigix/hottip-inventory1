import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

type PresetRange = 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'quarter' | 'last_quarter' | 'year' | 'last_year' | 'custom';

const getPresetRange = (preset: PresetRange): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { from: startOfWeek, to: today };
    
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { from: lastWeekStart, to: lastWeekEnd };
    
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfMonth, to: today };
    
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: lastMonthStart, to: lastMonthEnd };
    
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return { from: startOfQuarter, to: today };
    
    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3;
      const lastQuarterStart = new Date(lastQuarterYear, lastQuarterMonth, 1);
      const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterMonth + 3, 0);
      return { from: lastQuarterStart, to: lastQuarterEnd };
    
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { from: startOfYear, to: today };
    
    case 'last_year':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return { from: lastYearStart, to: lastYearEnd };
    
    default:
      return { from: null, to: null };
  }
};

const presetOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
];

export default function DateRangeSelector({ 
  dateRange, 
  onDateRangeChange, 
  className 
}: DateRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('month');
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  const handlePresetChange = (value: PresetRange) => {
    setSelectedPreset(value);
    
    if (value === 'custom') {
      setShowCustomCalendar(true);
    } else {
      setShowCustomCalendar(false);
      const newRange = getPresetRange(value);
      onDateRangeChange(newRange);
    }
  };

  const handleCustomDateSelect = (range: DateRange) => {
    onDateRangeChange(range);
  };

  const formatDateRange = (range: DateRange): string => {
    if (!range.from) return "Select date range";
    if (!range.to) return format(range.from, "MMM dd, yyyy");
    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, "MMM dd, yyyy");
    }
    return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      {/* Preset Selector */}
      <div className="flex-1">
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger data-testid="date-range-preset-selector">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Display */}
      <div className="flex-1">
        <Popover open={showCustomCalendar} onOpenChange={setShowCustomCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
              data-testid="custom-date-range-trigger"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange(dateRange)}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">From Date</h4>
                    <Calendar
                      mode="single"
                      selected={dateRange.from || undefined}
                      onSelect={(date) => handleCustomDateSelect({ 
                        from: date || null, 
                        to: dateRange.to 
                      })}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      initialFocus
                      data-testid="from-date-calendar"
                    />
                  </div>
                  
                  {dateRange.from && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">To Date</h4>
                      <Calendar
                        mode="single"
                        selected={dateRange.to || undefined}
                        onSelect={(date) => handleCustomDateSelect({ 
                          from: dateRange.from, 
                          to: date || null 
                        })}
                        disabled={(date) =>
                          date > new Date() || 
                          date < (dateRange.from || new Date("2020-01-01"))
                        }
                        data-testid="to-date-calendar"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowCustomCalendar(false)}
                      data-testid="cancel-custom-date"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setShowCustomCalendar(false)}
                      disabled={!dateRange.from || !dateRange.to}
                      data-testid="apply-custom-date"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Info */}
      <div className="text-sm text-muted-foreground self-center">
        {dateRange.from && dateRange.to && (
          <span data-testid="date-range-info">
            {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
          </span>
        )}
      </div>
    </div>
  );
}