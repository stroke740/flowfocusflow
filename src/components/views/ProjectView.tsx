import { useMemo, useState } from "react";
import { Settings, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/use-projects";
import { Task, FilterState } from "@/types/task";
import { useFilteredTasks } from "@/hooks/use-filtered-tasks";
import AddTaskInput from "@/components/tasks/AddTaskInput";
import TaskList from "@/components/tasks/TaskList";
import ProjectProgressBar from "@/components/projects/ProjectProgressBar";
import { Button } from "@/components/ui/button";

interface Props {
  project: Project;
  tasks: Task[];
  completedTasks: Task[];
  filters: FilterState;
  onEditTask: (task: Task) => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
}

const ProjectView = ({
  project, tasks, completedTasks, filters, onEditTask,
  onEditProject, onDeleteProject,
}: Props) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const projectActive = useMemo(
    () => tasks.filter((t) => (t as any).project_id === project.id),
    [tasks, project.id]
  );
  const projectCompleted = useMemo(
    () => completedTasks.filter((t) => (t as any).project_id === project.id),
    [completedTasks, project.id]
  );

  const filteredActive = useFilteredTasks(projectActive, filters);
  const total = projectActive.length + projectCompleted.length;

  return (
    <div className="space-y-5">
      {/* Project header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: project.color + "18" }}
        >
          {project.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{project.name}</h2>
          {total > 0 && (
            <ProjectProgressBar
              completed={projectCompleted.length}
              total={total}
              color={project.color}
              showLabel
              className="mt-1.5"
            />
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onEditProject}>
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive" onClick={onDeleteProject}>
          <Trash2 size={16} />
        </Button>
      </div>

      {total === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm mb-1 font-medium">No tasks yet</p>
          <p className="text-xs text-muted-foreground/60">Tap + to add your first task</p>
        </div>
      )}

      <AddTaskInput />

      {filteredActive.length > 0 && <TaskList tasks={filteredActive} onEditTask={onEditTask} />}

      {projectCompleted.length > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-2 text-xs text-muted-foreground active:text-foreground transition-colors py-1"
        >
          <ChevronDown size={14} className={cn("transition-transform duration-200", showCompleted && "rotate-180")} />
          <span className="font-medium">{projectCompleted.length} completed</span>
        </button>
      )}
      {showCompleted && projectCompleted.length > 0 && (
        <TaskList tasks={projectCompleted} onEditTask={onEditTask} />
      )}
    </div>
  );
};

export default ProjectView;
