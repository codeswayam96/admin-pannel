'use client';

import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const presets = [
  {
    label: 'Today',
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: 'This month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'This year',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
  align = 'start',
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handlePresetClick = (preset: (typeof presets)[number]) => {
    const range = preset.getValue();
    handleSelect(range);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal h-9',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex">
            {/* Presets */}
            <div className="border-r p-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Quick select
              </p>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleSelect}
                numberOfMonths={2}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
            >
              Clear
            </Button>
            <div className="text-xs text-muted-foreground">
              {date?.from && date?.to && (
                <>
                  {Math.ceil(
                    (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)
                  ) + 1}{' '}
                  days selected
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
