import { useMemo } from "react";
import { List } from "lucide-react";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";

interface AllTasksViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  groupByProject?: boolean;
}

const AllTasksView = ({ tasks, onEditTask, groupByProject = false }: AllTasksViewProps) => {
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
      <div className="text-center py-20">
        <List size={40} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No tasks found. Try adjusting your filters.</p>
      </div>
    );
  }

  if (grouped) {
    return (
      <div className="space-y-6">
        {grouped.map(([project, projectTasks]) => (
          <div key={project}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {project} <span className="text-muted-foreground/60">({projectTasks.length})</span>
            </h3>
            <TaskList tasks={projectTasks} onEditTask={onEditTask} />
          </div>
        ))}
      </div>
    );
  }

  return <TaskList tasks={tasks} onEditTask={onEditTask} />;
};

export default AllTasksView;
