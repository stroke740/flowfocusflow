import { useMemo, ReactNode, forwardRef } from "react";
import { List } from "lucide-react";
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
      <div ref={ref} className="text-center py-24">
        {emptyIcon || <List size={48} className="mx-auto mb-4 text-muted-foreground/15" />}
        <h3 className="text-base font-bold mb-1 mt-3">{emptyTitle || "No tasks found"}</h3>
        <p className="text-muted-foreground text-sm">{emptyDescription || "Try adjusting your filters or add a new task."}</p>
      </div>
    );
  }

  if (grouped) {
    return (
      <div ref={ref} className="space-y-6">
        {grouped.map(([project, projectTasks]) => (
          <div key={project}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {project} <span className="text-muted-foreground/40">({projectTasks.length})</span>
            </h3>
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
