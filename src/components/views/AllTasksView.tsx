import { useMemo, ReactNode, forwardRef } from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";

interface AllTasksViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  groupByProject?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

const AllTasksView = forwardRef<HTMLDivElement, AllTasksViewProps>(({
  tasks,
  onEditTask,
  groupByProject = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}, ref) => {
  const grouped = useMemo(() => {
    if (!groupByProject) return null;
    const map: Record<string, Task[]> = { "No Project": [] };
    for (const t of tasks) {
      const key = t.project || "No Project";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return Object.entries(map).filter(([, tasks]) => tasks.length > 0);
  }, [tasks, groupByProject]);

  if (tasks.length === 0) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center py-28"
      >
        <motion.div
          className="w-20 h-20 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-5"
          initial={{ rotate: -8 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {emptyIcon || <ClipboardList size={32} className="text-muted-foreground/25" />}
        </motion.div>
        <motion.h3
          className="text-[17px] font-bold mb-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {emptyTitle || "No tasks found"}
        </motion.h3>
        <motion.p
          className="text-muted-foreground text-[13px] max-w-[240px] mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          {emptyDescription || "Try adjusting your filters or add a new task."}
        </motion.p>
      </motion.div>
    );
  }

  if (grouped) {
    return (
      <div ref={ref} className="space-y-6">
        {grouped.map(([project, projectTasks], i) => (
          <motion.div
            key={project}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {project}
              </h3>
              <span className="text-[10px] text-muted-foreground/40 tabular-nums">{projectTasks.length}</span>
            </div>
            <TaskList tasks={projectTasks} onEditTask={onEditTask} />
          </motion.div>
        ))}
      </div>
    );
  }

  return <div ref={ref}><TaskList tasks={tasks} onEditTask={onEditTask} /></div>;
});

AllTasksView.displayName = "AllTasksView";

export default AllTasksView;
