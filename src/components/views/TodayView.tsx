import { useMemo, useState } from "react";
import { format, isToday, isBefore } from "date-fns";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";

interface TodayViewProps {
  tasks: Task[];
  completedToday: Task[];
  onEditTask: (task: Task) => void;
}

const TodayView = ({ tasks, completedToday, onEditTask }: TodayViewProps) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const overdue = useMemo(
    () => tasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), new Date()) && !isToday(new Date(t.due_date))),
    [tasks]
  );
  const todayOnly = useMemo(
    () => tasks.filter((t) => !overdue.includes(t)),
    [tasks, overdue]
  );

  const topP1 = tasks.find((t) => t.priority === "p1");

  if (tasks.length === 0 && completedToday.length === 0) {
    return (
      <div className="text-center py-24">
        <Sun size={52} className="mx-auto mb-5 text-warning/30 animate-float" />
        <h3 className="text-lg font-bold mb-1">You're all clear!</h3>
        <p className="text-muted-foreground text-sm">Enjoy your day ☀️</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date header */}
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground font-medium">{format(new Date(), "EEEE, MMMM d")}</p>
        <span className="text-xs text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Focus card */}
      {topP1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-0.5">Today's focus</p>
            <p className="text-sm font-bold truncate">{topP1.title}</p>
          </div>
        </motion.div>
      )}

      {overdue.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">
            Overdue · {overdue.length}
          </h3>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </div>
      )}

      {todayOnly.length > 0 && (
        <div>
          {overdue.length > 0 && (
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Today · {todayOnly.length}
            </h3>
          )}
          <TaskList tasks={todayOnly} onEditTask={onEditTask} />
        </div>
      )}

      {completedToday.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 py-1"
          >
            <ChevronDown size={14} className={cn("transition-transform duration-200", showCompleted && "rotate-180")} />
            <span className="font-medium">{completedToday.length} completed today</span>
          </button>
          {showCompleted && <TaskList tasks={completedToday} onEditTask={onEditTask} />}
        </div>
      )}
    </div>
  );
};

export default TodayView;
