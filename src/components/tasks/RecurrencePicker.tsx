import { useState } from "react";
import { Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval: number;
  weekdays?: number[]; // 0=Sun..6=Sat
  monthDay?: number;
  endDate?: Date;
  occurrences?: number;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

export function parseRecurrenceRule(str: string | null): RecurrenceRule | null {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export function serializeRecurrenceRule(rule: RecurrenceRule | null): string | null {
  if (!rule) return null;
  return JSON.stringify(rule);
}

export function getRecurrenceLabel(rule: RecurrenceRule | null): string {
  if (!rule) return "";
  const { frequency, interval, weekdays } = rule;
  if (frequency === "daily") return interval === 1 ? "Daily" : `Every ${interval} days`;
  if (frequency === "weekly") {
    const days = weekdays?.map((d) => WEEKDAY_LABELS[d]).join(", ");
    return interval === 1 ? `Weekly${days ? ` (${days})` : ""}` : `Every ${interval} weeks`;
  }
  if (frequency === "monthly") return interval === 1 ? "Monthly" : `Every ${interval} months`;
  if (frequency === "yearly") return "Yearly";
  return `Every ${interval} days`;
}

const RecurrencePicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState<RecurrenceRule["frequency"]>(value?.frequency || "weekly");
  const [interval, setInterval] = useState(value?.interval || 1);
  const [weekdays, setWeekdays] = useState<number[]>(value?.weekdays || []);
  const [endDate, setEndDate] = useState<Date | undefined>(value?.endDate);
  const [occurrences, setOccurrences] = useState<number | undefined>(value?.occurrences);

  const handleSave = () => {
    onChange({
      frequency: freq,
      interval,
      weekdays: freq === "weekly" ? weekdays : undefined,
      endDate,
      occurrences,
    });
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start h-10 rounded-xl text-sm gap-2", value && "text-primary border-primary/30")}
        >
          <Repeat size={14} />
          {value ? getRecurrenceLabel(value) : "No recurrence"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4 space-y-3">
        {/* Frequency */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Frequency</Label>
          <div className="grid grid-cols-4 gap-1">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFreq(f)}
                className={cn(
                  "h-8 rounded-lg text-[11px] font-medium border transition-colors capitalize",
                  freq === f ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Interval */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Every</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={interval}
            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 w-16 text-xs"
          />
          <span className="text-xs text-muted-foreground">
            {freq === "daily" ? "day(s)" : freq === "weekly" ? "week(s)" : freq === "monthly" ? "month(s)" : "year(s)"}
          </span>
        </div>

        {/* Weekday picker */}
        {freq === "weekly" && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">On days</Label>
            <div className="flex gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekday(i)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                    weekdays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* End condition */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Ends</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              placeholder="N times"
              value={occurrences || ""}
              onChange={(e) => setOccurrences(parseInt(e.target.value) || undefined)}
              className="h-8 text-xs flex-1"
            />
            <span className="text-xs text-muted-foreground flex items-center">or</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  {endDate ? format(endDate, "MMM d") : "Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={handleSave}>
            Set
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RecurrencePicker;
