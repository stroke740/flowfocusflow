import { useMemo, useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
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
    <div className="space-y-4">
      {/* Project header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: project.color + "20" }}
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
              className="mt-1"
            />
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditProject}>
          <Settings size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDeleteProject}>
          <Trash2 size={15} />
        </Button>
      </div>

      {total === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm mb-2">No tasks yet</p>
          <p className="text-xs text-muted-foreground">Add your first task to get started</p>
        </div>
      )}

      <AddTaskInput />

      {filteredActive.length > 0 && <TaskList tasks={filteredActive} onEditTask={onEditTask} />}

      {projectCompleted.length > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCompleted ? "Hide" : "Show"} {projectCompleted.length} completed
        </button>
      )}
      {showCompleted && projectCompleted.length > 0 && (
        <TaskList tasks={projectCompleted} onEditTask={onEditTask} />
      )}
    </div>
  );
};

export default ProjectView;
