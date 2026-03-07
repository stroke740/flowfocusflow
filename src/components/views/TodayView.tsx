import { useMemo, useState } from "react";
import { format, isToday, isBefore, startOfTomorrow } from "date-fns";
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
      <div className="text-center py-20">
        <Sun size={48} className="mx-auto mb-4 text-warning/60" />
        <h3 className="text-lg font-semibold mb-2">Clear skies ahead!</h3>
        <p className="text-muted-foreground text-sm">Enjoy your free day. Or add a task above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <span className="text-xs text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Focus prompt */}
      {topP1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3"
        >
          <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-primary mb-1">Today's focus</p>
            <p className="text-sm font-semibold">{topP1.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">What's the one task that would make today a success?</p>
          </div>
        </motion.div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
            Overdue ({overdue.length})
          </h3>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </div>
      )}

      {/* Today */}
      {todayOnly.length > 0 && (
        <div>
          {overdue.length > 0 && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Today ({todayOnly.length})
            </h3>
          )}
          <TaskList tasks={todayOnly} onEditTask={onEditTask} />
        </div>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronDown size={14} className={cn("transition-transform", showCompleted && "rotate-180")} />
            Show {completedToday.length} completed today
          </button>
          {showCompleted && <TaskList tasks={completedToday} onEditTask={onEditTask} />}
        </div>
      )}
    </div>
  );
};

export default TodayView;
