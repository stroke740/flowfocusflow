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
      <div className="text-center py-28">
        <div className="w-16 h-16 rounded-3xl bg-warning/8 flex items-center justify-center mx-auto mb-5 animate-float">
          <Sun size={28} className="text-warning/40" />
        </div>
        <h3 className="text-lg font-bold tracking-tight mb-1.5">You're all clear!</h3>
        <p className="text-muted-foreground text-[13px]">Enjoy your day ☀️</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground font-medium">{format(new Date(), "EEEE")}</p>
          <p className="text-[11px] text-muted-foreground/60">{format(new Date(), "MMMM d, yyyy")}</p>
        </div>
        <span className="text-[11px] text-muted-foreground/50 font-medium bg-muted/60 px-2.5 py-1 rounded-lg tabular-nums">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Focus card */}
      {topP1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/[0.04] border border-primary/8 rounded-2xl p-4 flex items-start gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.08em] mb-1">Today's focus</p>
            <p className="text-[14px] font-semibold truncate tracking-[-0.01em]">{topP1.title}</p>
          </div>
        </motion.div>
      )}

      {overdue.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-destructive/80 uppercase tracking-[0.06em] mb-3">
            Overdue · {overdue.length}
          </h3>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </div>
      )}

      {todayOnly.length > 0 && (
        <div>
          {overdue.length > 0 && (
            <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.06em] mb-3">
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
            className="flex items-center gap-2 text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-3 py-1"
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