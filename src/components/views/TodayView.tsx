import { useMemo, useState } from "react";
import { isToday, isBefore } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center py-28"
      >
        <motion.div
          className="w-20 h-20 rounded-3xl bg-success/8 flex items-center justify-center mx-auto mb-5"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sun size={32} className="text-success" />
        </motion.div>
        <h3 className="text-[17px] font-bold mb-1.5">All done for today!</h3>
        <p className="text-muted-foreground text-[13px] max-w-[220px] mx-auto leading-relaxed">
          Enjoy the rest of your day. You've earned it.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <h3 className="text-[11px] font-bold text-destructive uppercase tracking-wider">
              Overdue
            </h3>
            <span className="text-[10px] text-destructive/50 font-semibold tabular-nums">{overdue.length}</span>
          </div>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </motion.section>
      )}

      {todayOnly.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: overdue.length > 0 ? 0.1 : 0 }}
        >
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Today
              </h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">{todayOnly.length}</span>
            </div>
          )}
          <TaskList tasks={todayOnly} onEditTask={onEditTask} />
        </motion.section>
      )}

      {completedToday.length > 0 && (
        <section className="mt-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors py-2 group w-full"
          >
            <motion.div
              animate={{ rotate: showCompleted ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} />
            </motion.div>
            <CheckCircle2 size={12} className="text-success/50" />
            <span className="font-semibold">{completedToday.length} completed</span>
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <TaskList tasks={completedToday} onEditTask={onEditTask} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};

export default TodayView;
