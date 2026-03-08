import { useState, useMemo, useEffect } from "react";
import {
  Home, CalendarDays, CheckCircle2,
  Calendar, Plus, Search, FolderOpen, User,
  BarChart3, Timer, Moon, Sun,
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
import NotificationCenter from "@/components/notifications/NotificationCenter";
import OverdueReviewModal from "@/components/notifications/OverdueReviewModal";
import CommandPalette, { addRecentTask } from "@/components/search/CommandPalette";
import SettingsPage from "@/components/settings/SettingsPage";
import FocusMode from "@/components/focus/FocusMode";
import AnalyticsView from "@/components/views/AnalyticsView";
import DailyProgressRing from "@/components/home/DailyProgressRing";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { isToday, isBefore, startOfDay, startOfTomorrow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const mobileTabs: { id: ViewType | "search" | "projects"; label: string; icon: typeof Home }[] = [
  { id: "inbox", label: "Home", icon: Home },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "settings", label: "Me", icon: User },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const Dashboard = () => {
  const [view, setView] = useState<ViewType | "project">("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [slideDirection, setSlideDirection] = useState(0);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [overdueReviewOpen, setOverdueReviewOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: prefs } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const isDark = prefs?.theme === "dark" || (prefs?.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Apply theme on load and change
  useEffect(() => {
    if (!prefs) return;
    const root = document.documentElement;
    if (prefs.theme === "dark") {
      root.classList.add("dark");
    } else if (prefs.theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [prefs?.theme]);

  const toggleDarkMode = () => {
    const newTheme = isDark ? "light" : "dark";
    updatePrefs.mutate({ theme: newTheme } as any);
  };
  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();
  const { data: projects = [] } = useProjects();
  const { data: taskCounts = new Map() } = useProjectTaskCounts();
  const { addProject, updateProject, deleteProject } = useProjectMutations();

  const inboxCount = useMemo(() => activeTasks.filter((t) => !t.project_id).length, [activeTasks]);

  const todayTasks = useMemo(
    () => activeTasks.filter((t) => t.due_date && (isToday(new Date(t.due_date)) || isBefore(new Date(t.due_date), startOfTomorrow()))),
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

  const viewOrder: Record<string, number> = { inbox: 0, today: 1, upcoming: 2, all: 3, completed: 4, project: 5, analytics: 6, settings: 7 };
  const switchView = (v: ViewType | "project", projectId?: string) => {
    const oldIdx = viewOrder[view] ?? 0;
    const newIdx = viewOrder[v] ?? 0;
    setSlideDirection(newIdx > oldIdx ? 1 : newIdx < oldIdx ? -1 : 0);
    setView(v);
    setSelectedProjectId(projectId || null);
    setMobileProjectsOpen(false);
    setFilters(DEFAULT_FILTERS);
  };

  const currentTitle =
    view === "settings" ? ""
    : view === "project" && selectedProject ? selectedProject.name
    : mobileTabs.find((v) => v.id === view)?.label
      || (view === "upcoming" ? "Upcoming" : view === "completed" ? "Completed" : view === "analytics" ? "Analytics" : "Tasks");

  const showAddTask = !["completed", "settings", "analytics"].includes(view);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
  const showGreetingHeader = view === "today" || view === "inbox";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden safe-area-top">
      {/* HEADER */}
      {view !== "settings" && (
        <header className="flex-shrink-0 bg-background">
          {showGreetingHeader ? (
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h1 className="text-[22px] font-bold tracking-tight leading-tight">
                    {currentTitle}
                  </h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleDarkMode}
                    className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
                  </button>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Search size={16} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => { setFocusTask(null); setFocusOpen(true); }}
                    className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Timer size={16} strokeWidth={1.8} />
                  </button>
                  <NotificationCenter onNavigateToTask={handleNavigateToTask} />
                </div>
              </div>

              {/* Quick stats row */}
              {view === "today" && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[12px] text-muted-foreground">
                    <span className="text-foreground font-semibold">{todayTasks.length}</span> tasks
                  </span>
                  {completedToday.length > 0 && (
                    <span className="text-[12px] text-muted-foreground">
                      <span className="text-success font-semibold">{completedToday.length}</span> done
                    </span>
                  )}
                  {overdueCount > 0 && (
                    <button
                      onClick={() => setOverdueReviewOpen(true)}
                      className="text-[12px] text-destructive font-semibold hover:underline"
                    >
                      {overdueCount} overdue
                    </button>
                  )}
                </div>
              )}
              {view === "inbox" && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[12px] text-muted-foreground">
                    <span className="text-foreground font-semibold">{inboxCount}</span> tasks
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-13 flex items-center gap-3 px-5 border-b border-border">
              {view === "project" && selectedProject && (
                <span className="w-3 h-3 rounded-[5px] flex-shrink-0" style={{ backgroundColor: selectedProject.color }} />
              )}
              <h1 className="text-[17px] font-bold flex-1 truncate tracking-tight">{currentTitle}</h1>

              <div className="flex items-center gap-1">
                {overdueCount > 0 && !showGreetingHeader && (
                  <button
                    onClick={() => setOverdueReviewOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold"
                  >
                    {overdueCount} overdue
                  </button>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
                </button>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Search size={16} strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => { setFocusTask(null); setFocusOpen(true); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Timer size={16} strokeWidth={1.8} />
                </button>
                <NotificationCenter onNavigateToTask={handleNavigateToTask} />
              </div>
            </div>
          )}
        </header>
      )}

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 pb-28 max-w-2xl mx-auto">
          {view !== "completed" && view !== "project" && view !== "settings" && view !== "analytics" && (
            <div className="mb-3">
              <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
            </div>
          )}

          {view === "settings" ? (
            <SettingsPage />
          ) : isLoading && view !== "project" ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-[18px] h-[18px] rounded-full animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded animate-shimmer" />
                    <div className="h-2.5 w-1/3 rounded animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view + (selectedProjectId || "")}
                initial={{ opacity: 0, x: slideDirection * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection * -40 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {view === "today" && (
                  <TodayView tasks={filteredTasks} completedToday={completedToday} onEditTask={handleSelectTask} />
                )}
                {view === "inbox" && (
                  <AllTasksView
                    tasks={filteredTasks}
                    onEditTask={handleSelectTask}
                    emptyIcon={<Home size={40} className="text-muted-foreground/20 mx-auto" />}
                    emptyTitle="All clear!"
                    emptyDescription="Tasks without a project land here."
                  />
                )}
                {view === "upcoming" && <UpcomingView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                {view === "all" && <AllTasksView tasks={filteredTasks} onEditTask={handleSelectTask} />}
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

      {/* TASK DETAIL — Bottom Sheet */}
      <Sheet open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 overflow-hidden">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-2 mb-1" />
          <div className="h-[calc(100%-16px)] overflow-y-auto">
            {editingTask && (
              <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} projects={projects} tags={tags} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* FAB */}
      {showAddTask && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
          onClick={() => setMobileAddOpen(true)}
          className="fixed right-5 bottom-[calc(4rem+env(safe-area-inset-bottom)+12px)] z-30 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-glow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Add task sheet */}
      <AddTaskInput asSheet sheetOpen={mobileAddOpen} onSheetOpenChange={setMobileAddOpen} />

      {/* BOTTOM TAB BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/60 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-1 h-14">
          {mobileTabs.map((tab) => {
            const isActive =
              tab.id === "search" ? false
              : tab.id === "projects" ? (view === "project" || mobileProjectsOpen)
              : tab.id === "settings" ? view === "settings"
              : view === tab.id && !selectedProjectId;

            const badge = tab.id === "inbox" && inboxCount > 0 ? inboxCount
              : tab.id === "today" && todayTasks.length > 0 ? todayTasks.length
              : null;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "search") setSearchOpen(true);
                  else if (tab.id === "projects") setMobileProjectsOpen(true);
                  else if (tab.id === "settings") switchView("settings" as any);
                  else switchView(tab.id as ViewType);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all duration-200 min-w-[52px] rounded-xl",
                  isActive ? "text-primary" : "text-muted-foreground/70 hover:text-muted-foreground"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -inset-1.5 rounded-lg bg-primary/10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <tab.icon size={20} strokeWidth={isActive ? 2.2 : 1.5} className="relative z-10" />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center z-20">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] relative z-10 transition-all",
                  isActive ? "font-bold" : "font-medium"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects sheet */}
      <Sheet open={mobileProjectsOpen} onOpenChange={setMobileProjectsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-1 mb-3" />
          <SheetHeader>
            <SheetTitle className="text-left text-base">Projects</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-0.5">
            {projects.map((project) => {
              const counts = taskCounts.get(project.id);
              const activeCount = counts ? counts.total - counts.completed : 0;
              return (
                <button
                  key={project.id}
                  onClick={() => switchView("project", project.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted active:bg-muted transition-colors"
                >
                  <span className="w-3 h-3 rounded-[5px] flex-shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="flex-1 text-left text-[13px] font-medium">{project.name}</span>
                  {activeCount > 0 && (
                    <span className="text-[11px] text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded-md">{activeCount}</span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => { setMobileProjectsOpen(false); setEditingProject(null); setProjectFormOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary hover:bg-muted transition-colors"
            >
              <Plus size={14} />
              <span className="text-[13px] font-medium">Add project</span>
            </button>

            <div className="pt-3 border-t border-border mt-3 space-y-0.5">
              {[
                { icon: Calendar, label: "Upcoming", action: () => switchView("upcoming") },
                { icon: CheckCircle2, label: "Completed", action: () => switchView("completed") },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => { setMobileProjectsOpen(false); action(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Icon size={16} />
                  <span className="text-[13px] font-medium">{label}</span>
                </button>
              ))}
            </div>
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
