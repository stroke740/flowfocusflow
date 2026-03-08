import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const CalendarView = ({ tasks, onEditTask }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.due_date) {
        const key = format(new Date(t.due_date), "yyyy-MM-dd");
        const existing = map.get(key) || [];
        existing.push(t);
        map.set(key, existing);
      }
    });
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  }, [selectedDate, tasksByDate]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <h3 className="text-[15px] font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(key) || [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);

          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedDate(selected ? null : day)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative",
                !inMonth && "opacity-30",
                selected ? "bg-primary text-primary-foreground" : today ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <span className={cn("text-[13px] font-medium", today && !selected && "text-primary")}>{format(day, "d")}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5">
                  {dayTasks.slice(0, 3).map((_, j) => (
                    <div key={j} className={cn("w-1 h-1 rounded-full", selected ? "bg-primary-foreground/70" : "bg-primary")} />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={format(selectedDate, "yyyy-MM-dd")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
              {format(selectedDate, "EEEE, MMM d")} · {selectedDayTasks.length} tasks
            </h4>
            {selectedDayTasks.length === 0 ? (
              <p className="text-[13px] text-muted-foreground/50 py-4 text-center">No tasks scheduled</p>
            ) : (
              selectedDayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="text-[13px] font-medium truncate">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {task.priority !== "p4" && `${task.priority.toUpperCase()} · `}
                    {task.due_date && format(new Date(task.due_date), "h:mm a")}
                  </p>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
