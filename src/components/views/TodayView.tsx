import { useMemo, useState } from "react";
import { format, isToday, isBefore } from "date-fns";
import { motion } from "framer-motion";
import { ChevronDown, Coffee } from "lucide-react";
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
      <div className="text-center py-20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Coffee size={20} className="text-muted-foreground/40" />
        </div>
        <h3 className="text-sm font-medium mb-1">All done for today</h3>
        <p className="text-muted-foreground text-[13px]">Enjoy the rest of your day</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date header — Todoist style */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-bold tracking-tight">{format(new Date(), "MMM d")} ‧ Today</h2>
        <span className="text-[12px] text-muted-foreground font-normal">{format(new Date(), "EEEE")}</span>
      </div>

      {overdue.length > 0 && (
        <section>
          <h3 className="text-[12px] font-semibold text-destructive mb-2">
            Overdue
          </h3>
          <TaskList tasks={overdue} onEditTask={onEditTask} />
        </section>
      )}

      {todayOnly.length > 0 && (
        <section>
          {overdue.length > 0 && (
            <h3 className="text-[12px] font-semibold text-muted-foreground mb-2">
              {todayOnly.length} task{todayOnly.length !== 1 ? "s" : ""}
            </h3>
          )}
          <TaskList tasks={todayOnly} onEditTask={onEditTask} />
        </section>
      )}

      {completedToday.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ChevronDown size={14} className={cn("transition-transform duration-150", showCompleted && "rotate-180")} />
            <span className="font-medium">{completedToday.length} completed</span>
          </button>
          {showCompleted && <TaskList tasks={completedToday} onEditTask={onEditTask} />}
        </section>
      )}
    </div>
  );
};

export default TodayView;
