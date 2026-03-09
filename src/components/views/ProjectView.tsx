import { useMemo, useState } from "react";
import { Settings, Trash2, ChevronDown, Plus, X, MoreHorizontal, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/use-projects";
import { Task, FilterState } from "@/types/task";
import { useFilteredTasks } from "@/hooks/use-filtered-tasks";
import { useSections, useSectionMutations, Section } from "@/hooks/use-sections";
import { useTaskMutations } from "@/hooks/use-tasks";
import AddTaskInput from "@/components/tasks/AddTaskInput";
import TaskList from "@/components/tasks/TaskList";
import ProjectProgressBar from "@/components/projects/ProjectProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [addingSectionName, setAddingSectionName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");

  const { data: sections = [] } = useSections(project.id);
  const { addSection, updateSection, deleteSection } = useSectionMutations();
  const { updateTask } = useTaskMutations();

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

  // Group tasks by section
  const unsectionedTasks = useMemo(
    () => filteredActive.filter(t => !(t as any).section_id),
    [filteredActive]
  );
  const tasksBySection = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of sections) map[s.id] = [];
    for (const t of filteredActive) {
      const sid = (t as any).section_id;
      if (sid && map[sid]) map[sid].push(t);
    }
    return map;
  }, [filteredActive, sections]);

  const handleAddSection = async () => {
    if (!addingSectionName.trim()) return;
    await addSection.mutateAsync({ projectId: project.id, name: addingSectionName.trim(), position: sections.length });
    setAddingSectionName("");
    setShowAddSection(false);
  };

  const handleRenameSection = async (id: string) => {
    if (!editingSectionName.trim()) return;
    await updateSection.mutateAsync({ id, name: editingSectionName.trim() });
    setEditingSectionId(null);
  };

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

      {/* Unsectioned tasks */}
      {unsectionedTasks.length > 0 && <TaskList tasks={unsectionedTasks} onEditTask={onEditTask} />}

      {/* Sections */}
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          tasks={tasksBySection[section.id] || []}
          onEditTask={onEditTask}
          isEditing={editingSectionId === section.id}
          editName={editingSectionName}
          onStartEdit={() => { setEditingSectionId(section.id); setEditingSectionName(section.name); }}
          onEditNameChange={setEditingSectionName}
          onRename={() => handleRenameSection(section.id)}
          onCancelEdit={() => setEditingSectionId(null)}
          onDelete={() => deleteSection.mutate(section.id)}
        />
      ))}

      {/* Add section button */}
      {showAddSection ? (
        <div className="flex items-center gap-2">
          <Input
            value={addingSectionName}
            onChange={(e) => setAddingSectionName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddSection(); if (e.key === "Escape") setShowAddSection(false); }}
            placeholder="Section name"
            className="h-8 text-sm rounded-lg flex-1"
            autoFocus
          />
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={handleAddSection}>Add</Button>
          <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setShowAddSection(false)}>
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          className="flex items-center gap-2 text-[12px] text-muted-foreground/60 hover:text-primary transition-colors py-2"
        >
          <Plus size={14} /> Add section
        </button>
      )}

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

function SectionBlock({
  section, tasks, onEditTask, isEditing, editName, onStartEdit, onEditNameChange, onRename, onCancelEdit, onDelete,
}: {
  section: Section;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onEditNameChange: (n: string) => void;
  onRename: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <button onClick={() => setCollapsed(!collapsed)} className="p-0.5">
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
        </button>
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onRename(); if (e.key === "Escape") onCancelEdit(); }}
            className="h-7 text-[12px] font-bold rounded-lg flex-1"
            autoFocus
          />
        ) : (
          <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex-1">{section.name}</h3>
        )}
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{tasks.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal size={13} className="text-muted-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-xl">
            <DropdownMenuItem onClick={onStartEdit}>
              <Pencil size={12} className="mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 size={12} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AnimatePresence>
        {!collapsed && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TaskList tasks={tasks} onEditTask={onEditTask} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ProjectView;
