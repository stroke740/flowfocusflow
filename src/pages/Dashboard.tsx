import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox, CalendarDays, CheckCircle2, LogOut, Menu,
  Calendar, List, Layers, Plus, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ViewType, FilterState, DEFAULT_FILTERS, Task } from "@/types/task";
import { useTasks, useTags } from "@/hooks/use-tasks";
import { useProjects, useProjectTaskCounts, useProjectMutations, Project } from "@/hooks/use-projects";
import { useFilteredTasks } from "@/hooks/use-filtered-tasks";
import AddTaskInput from "@/components/tasks/AddTaskInput";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import FilterBar from "@/components/tasks/FilterBar";
import TodayView from "@/components/views/TodayView";
import UpcomingView from "@/components/views/UpcomingView";
import AllTasksView from "@/components/views/AllTasksView";
import CompletedView from "@/components/views/CompletedView";
import ProjectView from "@/components/views/ProjectView";
import ProjectFormDialog from "@/components/projects/ProjectFormDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import ProjectProgressBar from "@/components/projects/ProjectProgressBar";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import OverdueReviewModal from "@/components/notifications/OverdueReviewModal";
import { isToday, isBefore, startOfDay, startOfTomorrow } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const builtInViews: { id: ViewType; label: string; icon: typeof Inbox }[] = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "all", label: "All Tasks", icon: List },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType | "project">("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [groupByProject, setGroupByProject] = useState(false);

  // Project dialogs
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [overdueReviewOpen, setOverdueReviewOpen] = useState(false);
  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();
  const { data: projects = [] } = useProjects();
  const { data: taskCounts = new Map() } = useProjectTaskCounts();
  const { addProject, updateProject, deleteProject } = useProjectMutations();

  // ⌘+Shift+P shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setEditingProject(null);
        setProjectFormOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const todayTasks = useMemo(
    () =>
      activeTasks.filter(
        (t) => t.due_date && (isToday(new Date(t.due_date)) || isBefore(new Date(t.due_date), startOfTomorrow()))
      ),
    [activeTasks]
  );

  const completedToday = useMemo(
    () => completedTasks.filter((t) => t.completed_at && isToday(new Date(t.completed_at))),
    [completedTasks]
  );

  const projectNames = useMemo(
    () => [...new Set([...activeTasks, ...completedTasks].map((t) => t.project).filter(Boolean))] as string[],
    [activeTasks, completedTasks]
  );

  const baseTasks = view === "completed" ? completedTasks : view === "today" ? todayTasks : activeTasks;
  const filteredTasks = useFilteredTasks(baseTasks, filters);
  const isLoading = view === "completed" ? loadingCompleted : loadingActive;

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Overdue count for badge
  const overdueCount = useMemo(
    () => activeTasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), startOfDay(new Date()))).length,
    [activeTasks]
  );

  // Show overdue review on first load if there are overdue tasks
  useEffect(() => {
    if (overdueCount > 0 && !loadingActive) {
      const dismissed = sessionStorage.getItem("overdue_dismissed");
      if (!dismissed) setOverdueReviewOpen(true);
    }
  }, [overdueCount, loadingActive]);

  const handleNavigateToTask = (taskId: string) => {
    const task = [...activeTasks, ...completedTasks].find((t) => t.id === taskId);
    if (task) setEditingTask(task);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSaveProject = async (data: { name: string; color: string; icon: string }) => {
    if (editingProject) {
      await updateProject.mutateAsync({ id: editingProject.id, ...data });
    } else {
      const newProject = await addProject.mutateAsync({ ...data, position: projects.length });
      setSelectedProjectId(newProject.id);
      setView("project");
    }
    setProjectFormOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (deleteTasks: boolean) => {
    if (!deletingProject) return;
    await deleteProject.mutateAsync({ id: deletingProject.id, deleteTasks });
    setDeleteDialogOpen(false);
    setDeletingProject(null);
    if (selectedProjectId === deletingProject.id) {
      setView("inbox");
      setSelectedProjectId(null);
    }
  };

  const currentTitle =
    view === "project" && selectedProject
      ? selectedProject.name
      : builtInViews.find((v) => v.id === view)?.label || "Tasks";

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen w-64 border-r border-border bg-card z-40 flex flex-col transition-transform md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border">
          <a href="/" className="text-lg font-bold tracking-tight">
            Focus<span className="text-primary">Flow</span>
          </a>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {builtInViews.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setView(v.id);
                setSelectedProjectId(null);
                setSidebarOpen(false);
                setFilters(DEFAULT_FILTERS);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                view === v.id && selectedProjectId === null
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <v.icon size={18} />
              {v.label}
              {v.id === "today" && todayTasks.length > 0 && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {todayTasks.length}
                </span>
              )}
              {v.id === "inbox" && activeTasks.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{activeTasks.length}</span>
              )}
            </button>
          ))}

          {/* Projects section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projects</span>
              <button
                onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="New Project (⌘+Shift+P)"
              >
                <Plus size={14} />
              </button>
            </div>

            {projects.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No projects yet
              </p>
            )}

            {projects.map((project) => {
              const counts = taskCounts.get(project.id);
              const isActive = view === "project" && selectedProjectId === project.id;
              return (
                <ContextMenu key={project.id}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => {
                        setView("project");
                        setSelectedProjectId(project.id);
                        setSidebarOpen(false);
                        setFilters(DEFAULT_FILTERS);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className="text-base flex-shrink-0">{project.icon}</span>
                      <span className="flex-1 text-left truncate">{project.name}</span>
                      {counts && counts.total > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <ProjectProgressBar
                            completed={counts.completed}
                            total={counts.total}
                            color={project.color}
                            className="w-8"
                          />
                          <span className="text-[10px] text-muted-foreground">{counts.total - counts.completed}</span>
                        </div>
                      )}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>
                      Edit Project
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() => { setDeletingProject(project); setDeleteDialogOpen(true); }}
                    >
                      Delete Project
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {view === "project" && selectedProject && (
              <span className="text-xl">{selectedProject.icon}</span>
            )}
            <h1 className="text-2xl font-bold">{currentTitle}</h1>

            {view === "all" && (
              <button
                onClick={() => setGroupByProject(!groupByProject)}
                className={cn(
                  "ml-auto p-2 rounded-lg transition-colors",
                  groupByProject ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
                title="Group by project"
              >
                <Layers size={16} />
              </button>
            )}
          </div>

          {view !== "project" && (
            <div className="mb-4">
              <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
            </div>
          )}

          {view !== "completed" && view !== "project" && (
            <div className="mb-4">
              <AddTaskInput />
            </div>
          )}

          {isLoading && view !== "project" ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {view === "today" && (
                <TodayView tasks={filteredTasks} completedToday={completedToday} onEditTask={setEditingTask} />
              )}
              {view === "inbox" && <AllTasksView tasks={filteredTasks} onEditTask={setEditingTask} />}
              {view === "upcoming" && <UpcomingView tasks={filteredTasks} onEditTask={setEditingTask} />}
              {view === "all" && <AllTasksView tasks={filteredTasks} onEditTask={setEditingTask} groupByProject={groupByProject} />}
              {view === "completed" && <CompletedView tasks={filteredTasks} onEditTask={setEditingTask} />}
              {view === "project" && selectedProject && (
                <ProjectView
                  project={selectedProject}
                  tasks={activeTasks}
                  completedTasks={completedTasks}
                  filters={filters}
                  onEditTask={setEditingTask}
                  onEditProject={() => { setEditingProject(selectedProject); setProjectFormOpen(true); }}
                  onDeleteProject={() => { setDeletingProject(selectedProject); setDeleteDialogOpen(true); }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Detail panel */}
      {editingTask && <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} />}
      {editingTask && <div className="fixed inset-0 z-30 bg-foreground/10" onClick={() => setEditingTask(null)} />}

      {/* Project dialogs */}
      <ProjectFormDialog
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        project={editingProject}
        onSave={handleSaveProject}
        isPending={addProject.isPending || updateProject.isPending}
      />
      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={deletingProject}
        taskCount={deletingProject ? (taskCounts.get(deletingProject.id)?.total || 0) : 0}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
};

export default Dashboard;
