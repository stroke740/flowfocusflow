import { useMemo, useState } from "react";
import { format, isToday, isBefore } from "date-fns";
import { motion } from "framer-motion";
import { ChevronDown, Sun, CheckCircle2 } from "lucide-react";
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

  if (tasks.length === 0 && completedToday.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center py-20"
      >
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Sun size={28} className="text-success" />
        </div>
        <h3 className="text-base font-bold mb-1">All done for today!</h3>
        <p className="text-muted-foreground text-[13px] max-w-[220px] mx-auto">
          Enjoy the rest of your day. You've earned it.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            <h3 className="text-[12px] font-bold text-destructive uppercase tracking-wider">
              Overdue
            </h3>
            <span className="text-[11px] text-destructive/60 font-medium">{overdue.length}</span>
          </div>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </section>
      )}

      {todayOnly.length > 0 && (
        <section>
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider">
                Today
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">{todayOnly.length}</span>
            </div>
          )}
          <TaskList tasks={todayOnly} onEditTask={onEditTask} />
        </section>
      )}

      {completedToday.length > 0 && (
        <section className="mt-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors py-1.5 group"
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform duration-200", showCompleted && "rotate-180")}
            />
            <CheckCircle2 size={12} className="text-success/60" />
            <span className="font-semibold">{completedToday.length} completed today</span>
          </button>
          {showCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TaskList tasks={completedToday} onEditTask={onEditTask} />
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
};

export default TodayView;
