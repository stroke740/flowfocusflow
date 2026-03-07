import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Inbox, CalendarDays, CheckCircle2, Menu,
  Calendar, List, Layers, Plus, Search, Settings,
  BarChart3, Timer, PanelLeftClose, PanelLeft,
  MoreHorizontal, Pencil, Trash2, FolderOpen, Sun,
  Tag, ChevronDown, User,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const builtInViews: { id: ViewType; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "all", label: "All Tasks", icon: List },
];

// Bottom tab bar tabs for mobile
const mobileTabs: { id: ViewType | "search" | "projects"; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "search", label: "Search", icon: Search },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "settings", label: "Profile", icon: User },
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
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const isMobile = useIsMobile();

  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();
  const { data: projects = [] } = useProjects();
  const { data: taskCounts = new Map() } = useProjectTaskCounts();
  const { addProject, updateProject, deleteProject } = useProjectMutations();

  // Auto-collapse sidebar to icon rail on tablet
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 768 && w < 1280) {
        setSidebarCollapsed(true);
      } else if (w >= 1280) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setMobileProjectsOpen(false);
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

  // Sidebar nav item with optional tooltip (for collapsed/tablet)
  const SidebarNavItem = ({ v, isActive, count }: { v: typeof builtInViews[0]; isActive: boolean; count: number }) => {
    const btn = (
      <button
        onClick={() => switchView(v.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          sidebarCollapsed && "justify-center px-0",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <v.icon size={18} className="flex-shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{v.label}</span>
            {count > 0 && (
              <span className={cn("text-xs min-w-[20px] text-center", isActive ? "text-primary" : "text-muted-foreground")}>
                {count}
              </span>
            )}
          </>
        )}
      </button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{v.label}{count > 0 ? ` (${count})` : ""}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  // --- RENDER ---
  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR — hidden on mobile, icon-rail on tablet, full on desktop ===== */}
      <aside
        className={cn(
          "hidden md:flex fixed md:relative top-0 left-0 h-full bg-card border-r border-border z-50 flex-col transition-all duration-[250ms] ease-in-out",
          sidebarCollapsed ? "md:w-[68px]" : "md:w-[260px]",
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
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {builtInViews.map((v) => (
            <SidebarNavItem
              key={v.id}
              v={v}
              isActive={view === v.id && selectedProjectId === null}
              count={viewCounts[v.id] || 0}
            />
          ))}

          {/* Analytics */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => switchView("analytics")}
                  className={cn(
                    "w-full flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors",
                    view === "analytics" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <BarChart3 size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Analytics</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => switchView("analytics")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                view === "analytics" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <BarChart3 size={18} className="flex-shrink-0" />
              <span className="flex-1 text-left">Analytics</span>
            </button>
          )}

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
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="flex-1 text-left truncate">{project.name}</span>
                        {activeCount > 0 && <span className="text-xs text-muted-foreground">{activeCount}</span>}
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
                      <ContextMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>Rename</ContextMenuItem>
                      <ContextMenuItem onClick={() => { setEditingProject(project); setProjectFormOpen(true); }}>Change Color</ContextMenuItem>
                      <ContextMenuItem className="text-destructive" onClick={() => { setDeletingProject(project); setDeleteDialogOpen(true); }}>Delete</ContextMenuItem>
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
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => switchView("settings")}
                  className={cn(
                    "w-full flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors",
                    view === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Settings size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                onClick={() => switchView("settings")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  view === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Settings size={18} className="flex-shrink-0" />
                <span>Settings</span>
              </button>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">U</div>
                <span className="text-sm font-medium truncate">User</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ===== CENTER PANEL ===== */}
      <main className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header */}
        {view !== "settings" && (
          <header className="h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border flex-shrink-0">
            {view === "project" && selectedProject && (
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedProject.color }} />
            )}
            <h1 className="text-lg font-semibold flex-1 truncate">{currentTitle}</h1>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground text-xs transition-colors"
              >
                <Search size={13} />
                <span className="hidden sm:inline">Search…</span>
                <kbd className="hidden lg:flex items-center px-1 py-0.5 rounded bg-background text-[9px] font-mono border border-border">⌘K</kbd>
              </button>
              <button
                onClick={() => { setFocusTask(null); setFocusOpen(true); }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
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
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className={cn("mx-auto px-4 md:px-6 py-6", editingTask && !isMobile ? "max-w-2xl" : "max-w-3xl")}>
            {view !== "completed" && view !== "project" && view !== "settings" && view !== "analytics" && (
              <div className="mb-4">
                <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
              </div>
            )}

            {/* Desktop add task input (hidden on mobile — FAB is used instead) */}
            {showAddTask && view !== "project" && !isMobile && (
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
        {editingTask && !isMobile && (
          <>
            {/* Tablet: overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/10 z-30 lg:hidden"
              onClick={() => setEditingTask(null)}
            />
            {/* Panel — fixed overlay on tablet, relative on desktop */}
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={cn(
                "fixed lg:relative right-0 top-0 bottom-0 z-40 lg:z-auto",
                "w-[380px] lg:w-[360px]",
                "bg-card border-l border-border flex-shrink-0"
              )}
            >
              <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} projects={projects} tags={tags} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MOBILE: Task detail bottom sheet ===== */}
      {isMobile && (
        <Sheet open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {editingTask && (
                <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} projects={projects} tags={tags} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ===== MOBILE: FAB (Floating Action Button) ===== */}
      {isMobile && showAddTask && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
          onClick={() => setMobileAddOpen(true)}
          className="fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Mobile add task sheet */}
      {isMobile && (
        <AddTaskInput asSheet sheetOpen={mobileAddOpen} onSheetOpenChange={setMobileAddOpen} />
      )}

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-card/95 backdrop-blur-lg border-t border-border z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {mobileTabs.map((tab) => {
            const isActive =
              tab.id === "search" ? false
              : tab.id === "projects" ? (view === "project" || mobileProjectsOpen)
              : tab.id === "settings" ? view === "settings"
              : view === tab.id && !selectedProjectId;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "search") {
                    setSearchOpen(true);
                  } else if (tab.id === "projects") {
                    setMobileProjectsOpen(true);
                  } else if (tab.id === "settings") {
                    switchView("settings" as any);
                  } else {
                    switchView(tab.id as ViewType);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[52px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile projects sheet */}
      <Sheet open={mobileProjectsOpen} onOpenChange={setMobileProjectsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Projects</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {projects.map((project) => {
              const counts = taskCounts.get(project.id);
              const activeCount = counts ? counts.total - counts.completed : 0;
              return (
                <button
                  key={project.id}
                  onClick={() => switchView("project", project.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="flex-1 text-left text-sm font-medium">{project.name}</span>
                  {activeCount > 0 && <span className="text-xs text-muted-foreground">{activeCount} tasks</span>}
                </button>
              );
            })}
            <button
              onClick={() => { setMobileProjectsOpen(false); setEditingProject(null); setProjectFormOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-primary hover:bg-muted transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">New Project</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

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
