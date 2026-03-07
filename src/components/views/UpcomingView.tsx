import { useMemo, useState } from "react";
import {
  format, addDays, startOfWeek, endOfWeek, addWeeks,
  isWithinInterval, isBefore, isAfter, startOfDay, eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";
import { Button } from "@/components/ui/button";

interface UpcomingViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const UpcomingView = ({ tasks, onEditTask }: UpcomingViewProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map.set(
        key,
        tasks.filter((t) => t.due_date && format(new Date(t.due_date), "yyyy-MM-dd") === key)
      );
    }
    return map;
  }, [tasks, days]);

  // Tasks with no date
  const noDate = tasks.filter((t) => !t.due_date);

  return (
    <div className="space-y-6">
      {/* Week strip */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 flex gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = tasksByDay.get(key)?.length || 0;
            const isToday = format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
            return (
              <div
                key={key}
                className={cn(
                  "flex-1 text-center py-2 rounded-xl transition-colors",
                  isToday && "bg-primary/10"
                )}
              >
                <p className="text-[10px] text-muted-foreground uppercase">{format(day, "EEE")}</p>
                <p className={cn("text-sm font-semibold", isToday && "text-primary")}>{format(day, "d")}</p>
                {count > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                    {count > 3 && <span className="text-[8px] text-muted-foreground">+{count - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Tasks grouped by day */}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDay.get(key) || [];
        if (dayTasks.length === 0) return null;
        const isToday = format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
        return (
          <div key={key}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {isToday ? "Today" : format(day, "EEEE, MMM d")}
              <span className="ml-2 text-muted-foreground/60">{dayTasks.length}</span>
            </h3>
            <TaskList tasks={dayTasks} onEditTask={onEditTask} />
          </div>
        );
      })}

      {/* No date */}
      {noDate.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            No Date <span className="text-muted-foreground/60">{noDate.length}</span>
          </h3>
          <TaskList tasks={noDate} onEditTask={onEditTask} />
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <CalendarIcon size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No upcoming tasks. Add one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingView;
