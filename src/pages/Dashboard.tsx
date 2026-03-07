import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Inbox, CalendarDays, CheckCircle2, Menu,
  Calendar, List, Layers, Plus, Search, Settings,
  BarChart3, Timer, PanelLeftClose, PanelLeft,
  MoreHorizontal, Pencil, Trash2, FolderOpen, Sun,
  Tag, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import CommandPalette, { addRecentTask } from "@/components/search/CommandPalette";
import SettingsPage from "@/components/settings/SettingsPage";
import FocusMode from "@/components/focus/FocusMode";
import AnalyticsView from "@/components/views/AnalyticsView";
import { isToday, isBefore, startOfDay, startOfTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const builtInViews: { id: ViewType; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "all", label: "All Tasks", icon: List },
];

const Dashboard = () => {
  const [view, setView] = useState<ViewType | "project">("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [groupByProject, setGroupByProject] = useState(false);

  // Project dialogs
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [overdueReviewOpen, setOverdueReviewOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [tagsSidebarOpen, setTagsSidebarOpen] = useState(true);

  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();
  const { data: projects = [] } = useProjects();
  const { data: taskCounts = new Map() } = useProjectTaskCounts();
  const { addProject, updateProject, deleteProject } = useProjectMutations();

  // Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setEditingProject(null);
        setProjectFormOpen(true);
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const inboxCount = useMemo(
    () => activeTasks.filter((t) => !t.project_id).length,
    [activeTasks]
  );

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

  const baseTasks = view === "completed" ? completedTasks
    : view === "today" ? todayTasks
    : view === "inbox" ? activeTasks.filter((t) => !t.project_id)
    : activeTasks;
  const filteredTasks = useFilteredTasks(baseTasks, filters);
  const isLoading = view === "completed" ? loadingCompleted : loadingActive;

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const overdueCount = useMemo(
    () => activeTasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), startOfDay(new Date()))).length,
    [activeTasks]
  );

  useEffect(() => {
    if (overdueCount > 0 && !loadingActive) {
      const dismissed = sessionStorage.getItem("overdue_dismissed");
      if (!dismissed) setOverdueReviewOpen(true);
    }
  }, [overdueCount, loadingActive]);

  const handleNavigateToTask = (taskId: string) => {
    const task = [...activeTasks, ...completedTasks].find((t) => t.id === taskId);
    if (task) { addRecentTask(task.id); setEditingTask(task); }
  };

  const handleSelectTask = (task: Task) => {
    addRecentTask(task.id);
    setEditingTask(task);
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

  const switchView = (v: ViewType | "project", projectId?: string) => {
    setView(v);
    setSelectedProjectId(projectId || null);
    setMobileSidebarOpen(false);
    setFilters(DEFAULT_FILTERS);
  };

  const currentTitle =
    view === "settings" ? ""
    : view === "project" && selectedProject ? selectedProject.name
    : builtInViews.find((v) => v.id === view)?.label || "Tasks";

  const viewCounts: Record<string, number> = {
    inbox: inboxCount,
    today: todayTasks.length,
    upcoming: activeTasks.filter((t) => t.due_date).length,
    completed: completedTasks.length,
    all: activeTasks.length,
  };

  const showAddTask = !["completed", "settings", "analytics"].includes(view);

  // --- RENDER ---

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={cn(
          "fixed md:relative top-0 left-0 h-full bg-card border-r border-border z-50 flex flex-col transition-all duration-[250ms] ease-in-out",
          // Desktop
          sidebarCollapsed ? "md:w-[68px]" : "md:w-[260px]",
          // Mobile
          mobileSidebarOpen ? "w-[280px] translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo + collapse */}
        <div className={cn("h-14 flex items-center border-b border-border px-4 gap-3", sidebarCollapsed && "justify-center px-0")}>
          {!sidebarCollapsed && (
            <span className="text-base font-bold tracking-tight flex-1">
              Focus<span className="text-primary">Flow</span>
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {builtInViews.map((v) => {
            const isActive = view === v.id && selectedProjectId === null;
            const count = viewCounts[v.id] || 0;
            return (
              <button
                key={v.id}
                onClick={() => switchView(v.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={sidebarCollapsed ? v.label : undefined}
              >
                <v.icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{v.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "text-xs min-w-[20px] text-center",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Analytics */}
          <button
            onClick={() => switchView("analytics")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              sidebarCollapsed && "justify-center px-0",
              view === "analytics"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={sidebarCollapsed ? "Analytics" : undefined}
          >
            <BarChart3 size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="flex-1 text-left">Analytics</span>}
          </button>

          {/* Projects section */}
          {!sidebarCollapsed && (
            <div className="pt-5">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                <button
                  onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="New Project (⌘+Shift+P)"
                >
                  <Plus size={14} />
                </button>
              </div>

              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">No projects yet</p>
              )}

              {projects.map((project) => {
                const counts = taskCounts.get(project.id);
                const isActive = view === "project" && selectedProjectId === project.id;
                const activeCount = counts ? counts.total - counts.completed : 0;
                return (
                  <ContextMenu key={project.id}>
                    <ContextMenuTrigger>
                      <button
                        onClick={() => switchView("project", project.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group/project",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="flex-1 text-left truncate">{project.name}</span>
                        {activeCount > 0 && (
                          <span className="text-xs text-muted-foreground">{activeCount}</span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <span
                              className="p-0.5 rounded opacity-0 group-hover/project:opacity-100 hover:bg-muted-foreground/10 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal size={14} />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>
                              <Pencil size={14} className="mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setDeletingProject(project); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>
                        Change Color
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="text-destructive"
                        onClick={() => { setDeletingProject(project); setDeleteDialogOpen(true); }}
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}

              <button
                onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5"
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
            </div>
          )}

          {/* Tags section */}
          {!sidebarCollapsed && tags.length > 0 && (
            <div className="pt-3">
              <button
                onClick={() => setTagsSidebarOpen(!tagsSidebarOpen)}
                className="flex items-center justify-between w-full px-3 mb-1.5"
              >
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</span>
                <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", tagsSidebarOpen && "rotate-180")} />
              </button>
              {tagsSidebarOpen && (
                <div className="space-y-0.5">
                  {tags.map((tag) => {
                    const isActiveTag = filters.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const newTagIds = isActiveTag
                            ? filters.tagIds.filter((id) => id !== tag.id)
                            : [...filters.tagIds, tag.id];
                          setFilters({ ...filters, tagIds: newTagIds });
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                          isActiveTag
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="truncate">{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-border p-2", sidebarCollapsed && "flex flex-col items-center")}>
          <button
            onClick={() => switchView("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              sidebarCollapsed && "justify-center px-0",
              view === "settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={sidebarCollapsed ? "Settings" : undefined}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                U
              </div>
              <span className="text-sm font-medium truncate">User</span>
            </div>
          )}
        </div>
      </aside>

      {/* ===== CENTER PANEL ===== */}
      <main className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header */}
        {view !== "settings" && (
          <header className="h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border flex-shrink-0">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-muted" onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            {view === "project" && selectedProject && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedProject.color }}
              />
            )}
            <h1 className="text-lg font-semibold flex-1 truncate">{currentTitle}</h1>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground text-xs transition-colors"
              >
                <Search size={13} />
                <span className="hidden sm:inline">Search…</span>
                <kbd className="hidden sm:flex items-center px-1 py-0.5 rounded bg-background text-[9px] font-mono border border-border">⌘K</kbd>
              </button>
              <button
                onClick={() => { setFocusTask(null); setFocusOpen(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
              >
                <Timer size={13} />
                <span className="hidden sm:inline">Focus</span>
              </button>
              {view === "all" && (
                <button
                  onClick={() => setGroupByProject(!groupByProject)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    groupByProject ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                  title="Group by project"
                >
                  <Layers size={16} />
                </button>
              )}
              {overdueCount > 0 && (
                <button
                  onClick={() => setOverdueReviewOpen(true)}
                  className="px-2 py-1 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-xs font-medium"
                >
                  {overdueCount} overdue
                </button>
              )}
              <NotificationCenter onNavigateToTask={handleNavigateToTask} />
            </div>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn("mx-auto px-4 md:px-6 py-6", editingTask ? "max-w-2xl" : "max-w-3xl")}>
            {view !== "completed" && view !== "project" && view !== "settings" && view !== "analytics" && (
              <div className="mb-4">
                <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
              </div>
            )}

            {showAddTask && view !== "project" && (
              <div className="mb-4">
                <AddTaskInput />
              </div>
            )}

            {view === "settings" ? (
              <SettingsPage />
            ) : isLoading && view !== "project" ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={view + (selectedProjectId || "")}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === "today" && (
                    <TodayView tasks={filteredTasks} completedToday={completedToday} onEditTask={handleSelectTask} />
                  )}
                  {view === "inbox" && (
                    <AllTasksView
                      tasks={filteredTasks}
                      onEditTask={handleSelectTask}
                      emptyIcon={<Inbox size={44} className="text-muted-foreground/20" />}
                      emptyTitle="Zero tasks. You're on top of everything."
                      emptyDescription="Tasks without a project land here."
                    />
                  )}
                  {view === "upcoming" && <UpcomingView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                  {view === "all" && <AllTasksView tasks={filteredTasks} onEditTask={handleSelectTask} groupByProject={groupByProject} />}
                  {view === "completed" && <CompletedView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                  {view === "analytics" && <AnalyticsView activeTasks={activeTasks} completedTasks={completedTasks} />}
                  {view === "project" && selectedProject && (
                    <ProjectView
                      project={selectedProject}
                      tasks={activeTasks}
                      completedTasks={completedTasks}
                      filters={filters}
                      onEditTask={handleSelectTask}
                      onEditProject={() => { setEditingProject(selectedProject); setProjectFormOpen(true); }}
                      onDeleteProject={() => { setDeletingProject(selectedProject); setDeleteDialogOpen(true); }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* ===== RIGHT DETAIL PANEL ===== */}
      <AnimatePresence>
        {editingTask && (
          <>
            {/* Mobile: backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/10 z-30 md:hidden"
              onClick={() => setEditingTask(null)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={cn(
                "fixed md:relative right-0 top-0 bottom-0 z-40 md:z-auto",
                "w-full sm:w-[380px] md:w-[340px] lg:w-[360px]",
                "bg-card border-l border-border flex-shrink-0"
              )}
            >
              <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} projects={projects} tags={tags} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-30 flex items-center justify-around px-2 py-1 safe-area-bottom">
        {builtInViews.slice(0, 4).map((v) => {
          const isActive = view === v.id && !selectedProjectId;
          return (
            <button
              key={v.id}
              onClick={() => switchView(v.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <v.icon size={20} />
              <span className="text-[10px] font-medium">{v.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground"
          )}
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Dialogs */}
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
      <OverdueReviewModal
        tasks={activeTasks}
        open={overdueReviewOpen}
        onOpenChange={(open) => {
          setOverdueReviewOpen(open);
          if (!open) sessionStorage.setItem("overdue_dismissed", "true");
        }}
        onEditTask={setEditingTask}
      />
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        tasks={[...activeTasks, ...completedTasks]}
        projects={projects}
        onSelectTask={handleSelectTask}
        onNavigateView={(v) => switchView(v)}
        onNavigateProject={(id) => switchView("project", id)}
        onCreateProject={() => { setEditingProject(null); setProjectFormOpen(true); }}
        currentProjectName={view === "project" && selectedProject ? selectedProject.name : undefined}
      />
      <FocusMode
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        task={focusTask}
        tasks={activeTasks}
        onSelectTask={setFocusTask}
      />
    </div>
  );
};

export default Dashboard;
