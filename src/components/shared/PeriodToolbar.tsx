import { useState } from "react";
import { format } from "date-fns";
import { usePeriod, type PeriodMode } from "@/contexts/PeriodContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const MODES: { value: PeriodMode; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

export function PeriodToolbar() {
  const { mode, changeMode, changeCustomRange } = usePeriod();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      changeCustomRange(range.from, range.to);
      setCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {MODES.map((m) => (
        <Button
          key={m.value}
          size="sm"
          variant={mode === m.value ? "default" : "outline"}
          onClick={() => {
            if (m.value === "custom") {
              setCalendarOpen(true);
            } else {
              changeMode(m.value);
            }
          }}
          className="text-xs"
        >
          {m.label}
        </Button>
      ))}

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs gap-1.5",
              mode === "custom" && "border-primary text-primary"
            )}
            onClick={() => setCalendarOpen(true)}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
              : "Pick dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={1}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
