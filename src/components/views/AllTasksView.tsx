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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center py-24"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-4">
          {emptyIcon || <ClipboardList size={28} className="text-muted-foreground/30" />}
        </div>
        <h3 className="text-base font-bold mb-1">{emptyTitle || "No tasks found"}</h3>
        <p className="text-muted-foreground text-[13px] max-w-[240px] mx-auto">
          {emptyDescription || "Try adjusting your filters or add a new task."}
        </p>
      </motion.div>
    );
  }

  if (grouped) {
    return (
      <div ref={ref} className="space-y-6">
        {grouped.map(([project, projectTasks]) => (
          <div key={project}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                {project}
              </h3>
              <span className="text-[11px] text-muted-foreground/50">{projectTasks.length}</span>
            </div>
            <TaskList tasks={projectTasks} onEditTask={onEditTask} />
          </div>
        ))}
      </div>
    );
  }

  return <div ref={ref}><TaskList tasks={tasks} onEditTask={onEditTask} /></div>;
});

AllTasksView.displayName = "AllTasksView";

export default AllTasksView;
