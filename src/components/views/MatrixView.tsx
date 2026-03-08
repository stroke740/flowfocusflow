import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, ArrowUp, Clock, Inbox } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { isPast, isToday, addDays, isBefore } from "date-fns";

interface MatrixViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const MatrixView = ({ tasks, onEditTask }: MatrixViewProps) => {
  const quadrants = useMemo(() => {
    const isUrgent = (t: Task) =>
      t.due_date && (isPast(new Date(t.due_date)) || isToday(new Date(t.due_date)) || isBefore(new Date(t.due_date), addDays(new Date(), 2)));
    const isImportant = (t: Task) => t.priority === "p1" || t.priority === "p2";

    return {
      do: tasks.filter((t) => isUrgent(t) && isImportant(t)),
      schedule: tasks.filter((t) => !isUrgent(t) && isImportant(t)),
      delegate: tasks.filter((t) => isUrgent(t) && !isImportant(t)),
      eliminate: tasks.filter((t) => !isUrgent(t) && !isImportant(t)),
    };
  }, [tasks]);

  const sections = [
    { key: "do", title: "Do First", subtitle: "Urgent & Important", tasks: quadrants.do, icon: Flame, color: "text-destructive", bg: "bg-destructive/8", border: "border-destructive/20" },
    { key: "schedule", title: "Schedule", subtitle: "Important, Not Urgent", tasks: quadrants.schedule, icon: ArrowUp, color: "text-primary", bg: "bg-primary/8", border: "border-primary/20" },
    { key: "delegate", title: "Delegate", subtitle: "Urgent, Not Important", tasks: quadrants.delegate, icon: Clock, color: "text-warning", bg: "bg-warning/8", border: "border-warning/20" },
    { key: "eliminate", title: "Eliminate", subtitle: "Neither", tasks: quadrants.eliminate, icon: Inbox, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {sections.map((q, i) => (
        <motion.div
          key={q.key}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          className={cn("rounded-2xl border p-3 min-h-[160px]", q.bg, q.border)}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <q.icon size={13} className={q.color} />
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", q.color)}>{q.title}</span>
          </div>
          <p className="text-[9px] text-muted-foreground mb-2">{q.subtitle}</p>
          <div className="space-y-1">
            {q.tasks.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/40 italic">None</p>
            ) : (
              q.tasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="w-full text-left text-[11px] py-1.5 px-2 rounded-lg hover:bg-background/50 transition-colors truncate"
                >
                  {task.title}
                </button>
              ))
            )}
            {q.tasks.length > 5 && (
              <p className="text-[10px] text-muted-foreground">+{q.tasks.length - 5} more</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MatrixView;
