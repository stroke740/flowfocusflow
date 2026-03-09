import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import SplashScreen from "@/components/splash/SplashScreen";
import TaskSkeleton from "@/components/tasks/TaskSkeleton";
import UndoToast from "@/components/tasks/UndoToast";
import CalendarView from "@/components/views/CalendarView";
import MatrixView from "@/components/views/MatrixView";
import DailyPlanning from "@/components/planning/DailyPlanning";
import WeeklyReview from "@/components/planning/WeeklyReview";
import TaskTemplates from "@/components/tasks/TaskTemplates";
import HabitTracker from "@/components/habits/HabitTracker";
import ExportDialog from "@/components/export/ExportDialog";
import {
  Home, CalendarDays, CheckCircle2,
  Calendar, Plus, Search, FolderOpen, User,
  BarChart3, Timer, Moon, Sun, Grid3X3, Layout,
  Sparkles, Download, BarChart2, BookOpen,
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
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { WalletButton } from "@/components/wallet/WalletButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ExtendedView = ViewType | "project" | "calendar" | "matrix";

const mobileTabs: { id: string; label: string; icon: typeof Home }[] = [
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
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("focusflow_splash_done"));
  const [view, setView] = useState<ExtendedView>("inbox");
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
  const [homeProjectFilter, setHomeProjectFilter] = useState<string | null>(null);
  const [fabTaskOpen, setFabTaskOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("focusflow_onboarded"));

  // New feature states
  const [dailyPlanningOpen, setDailyPlanningOpen] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: prefs } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const qc = useQueryClient();
  const { requestPermission } = usePushNotifications();

  useEffect(() => {
    if (prefs?.push_notifications) {
      requestPermission();
    }
  }, [prefs?.push_notifications, requestPermission]);

  const handleRefresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["tasks"] });
  }, [qc]);

  const isDark = prefs?.theme === "dark" || (prefs?.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
    : view === "inbox" ? (homeProjectFilter
        ? activeTasks.filter((t) => t.project_id === homeProjectFilter)
        : activeTasks
      )
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

  const viewOrder: Record<string, number> = { inbox: 0, today: 1, upcoming: 2, all: 3, completed: 4, project: 5, analytics: 6, settings: 7, calendar: 8, matrix: 9 };
  const switchView = (v: ExtendedView, projectId?: string) => {
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
    : view === "calendar" ? "Calendar"
    : view === "matrix" ? "Priority Matrix"
    : view === "project" && selectedProject ? selectedProject.name
    : mobileTabs.find((v) => v.id === view)?.label
      || (view === "upcoming" ? "Upcoming" : view === "completed" ? "Completed" : view === "analytics" ? "Analytics" : "Tasks");

  const showAddTask = !["completed", "settings", "analytics", "calendar", "matrix"].includes(view);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
  const showGreetingHeader = view === "today" || view === "inbox";

  if (showSplash) {
    return <SplashScreen onComplete={() => { sessionStorage.setItem("focusflow_splash_done", "1"); setShowSplash(false); }} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          localStorage.setItem("focusflow_onboarded", "1");
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden safe-area-top">
      {/* Undo Toast */}
      <UndoToast />

      {/* HEADER */}
      {view !== "settings" && (
        <header className="flex-shrink-0 bg-background">
        {showGreetingHeader ? (
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <motion.h1
                    className="text-[24px] font-bold tracking-tight leading-tight"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {view === "inbox" ? getGreeting() : currentTitle}
                  </motion.h1>
                  {view === "inbox" && (
                    <motion.p
                      className="text-[13px] text-muted-foreground mt-0.5 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      {format(new Date(), "EEEE, MMM d")}
                    </motion.p>
                  )}
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
                  <WalletButton />
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
                <DailyProgressRing
                  completed={completedToday.length}
                  total={completedToday.length + todayTasks.length}
                  completedTasks={completedTasks}
                  projects={projects}
                  activeProjectFilter={homeProjectFilter}
                  onProjectFilter={setHomeProjectFilter}
                  taskCount={activeTasks.length}
                />
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
          {view !== "completed" && view !== "project" && view !== "settings" && view !== "analytics" && view !== "calendar" && view !== "matrix" && (
            <div className="mb-3">
              <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
            </div>
          )}

          {view === "settings" ? (
            <SettingsPage />
          ) : isLoading && view !== "project" && view !== "calendar" && view !== "matrix" ? (
            <TaskSkeleton count={5} />
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
                  <>
                    {/* Quick action chips */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
                      {[
                        { icon: Sun, label: "Plan Day", action: () => setDailyPlanningOpen(true), color: "text-warning" },
                        { icon: Calendar, label: "Calendar", action: () => switchView("calendar" as ExtendedView), color: "text-primary" },
                        { icon: Grid3X3, label: "Matrix", action: () => switchView("matrix" as ExtendedView), color: "text-destructive" },
                        { icon: Layout, label: "Templates", action: () => setTemplatesOpen(true), color: "text-accent-foreground" },
                        { icon: Sparkles, label: "Habits", action: () => setHabitsOpen(true), color: "text-success" },
                        { icon: BarChart2, label: "Review", action: () => setWeeklyReviewOpen(true), color: "text-primary" },
                        { icon: Download, label: "Export", action: () => setExportOpen(true), color: "text-muted-foreground" },
                      ].map((chip) => (
                        <motion.button
                          key={chip.label}
                          whileTap={{ scale: 0.95 }}
                          onClick={chip.action}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-[11px] font-medium whitespace-nowrap hover:bg-muted transition-colors flex-shrink-0"
                        >
                          <chip.icon size={12} className={chip.color} />
                          {chip.label}
                        </motion.button>
                      ))}
                    </div>
                    <AllTasksView
                      tasks={filteredTasks}
                      onEditTask={handleSelectTask}
                      emptyIcon={<Home size={40} className="text-muted-foreground/20 mx-auto" />}
                      emptyTitle="All clear!"
                      emptyDescription="Tasks without a project land here."
                    />
                  </>
                )}
                {view === "upcoming" && <UpcomingView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                {view === "all" && <AllTasksView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                {view === "completed" && <CompletedView tasks={filteredTasks} onEditTask={handleSelectTask} />}
                {view === "analytics" && <AnalyticsView activeTasks={activeTasks} completedTasks={completedTasks} />}
                {view === "calendar" && <CalendarView tasks={activeTasks} onEditTask={handleSelectTask} />}
                {view === "matrix" && <MatrixView tasks={activeTasks} onEditTask={handleSelectTask} />}
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

      {/* FAB with expandable actions */}
      {showAddTask && (
        <>
          <AnimatePresence>
            {mobileAddOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
                onClick={() => setMobileAddOpen(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {mobileAddOpen && (
              <div className="fixed right-5 bottom-[calc(4rem+env(safe-area-inset-bottom)+80px)] z-40 flex flex-col items-end gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => { setMobileAddOpen(false); setTemplatesOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
                >
                  <Layout size={16} className="text-accent-foreground" />
                  Template
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => { setMobileAddOpen(false); setFocusTask(null); setFocusOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
                >
                  <Timer size={16} className="text-warning" />
                  Focus Timer
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0 }}
                  onClick={() => { setMobileAddOpen(false); setFabTaskOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
                >
                  <CheckCircle2 size={16} className="text-primary" />
                  Task
                </motion.button>
              </div>
            )}
          </AnimatePresence>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: mobileAddOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 24, delay: mobileAddOpen ? 0 : 0.15 }}
            onClick={() => setMobileAddOpen(!mobileAddOpen)}
            className="fixed right-5 bottom-[calc(4.25rem+env(safe-area-inset-bottom)+12px)] z-40 w-[56px] h-[56px] rounded-[18px] bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={22} strokeWidth={2.5} />
          </motion.button>
        </>
      )}

      <AddTaskInput asSheet sheetOpen={fabTaskOpen} onSheetOpenChange={setFabTaskOpen} />

      {/* BOTTOM TAB BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/40 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 h-[58px]">
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
                  "relative flex flex-col items-center gap-[3px] px-3 py-1.5 transition-all duration-250 min-w-[48px]",
                  isActive ? "text-primary" : "text-muted-foreground/60 active:text-muted-foreground"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="tab-glow"
                      className="absolute -inset-2 rounded-xl bg-primary/8"
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    />
                  )}
                  <tab.icon
                    size={isActive ? 21 : 20}
                    strokeWidth={isActive ? 2.3 : 1.5}
                    className="relative z-10 transition-all duration-200"
                  />
                  {badge && badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center z-20 shadow-sm shadow-primary/30"
                    >
                      {badge > 99 ? "99+" : badge}
                    </motion.span>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] relative z-10 transition-all duration-200 tracking-wide",
                  isActive ? "font-bold text-primary" : "font-medium"
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
                { icon: Calendar, label: "Calendar", action: () => switchView("calendar" as ExtendedView) },
                { icon: Grid3X3, label: "Priority Matrix", action: () => switchView("matrix" as ExtendedView) },
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

      {/* New feature overlays */}
      <DailyPlanning
        open={dailyPlanningOpen}
        onClose={() => setDailyPlanningOpen(false)}
        tasks={activeTasks}
        onSelectTasks={() => {}}
      />
      <WeeklyReview
        open={weeklyReviewOpen}
        onClose={() => setWeeklyReviewOpen(false)}
        completedTasks={completedTasks}
        activeTasks={activeTasks}
      />
      <TaskTemplates open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <HabitTracker open={habitsOpen} onClose={() => setHabitsOpen(false)} />
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        activeTasks={activeTasks}
        completedTasks={completedTasks}
      />
    </div>
  );
};

export default Dashboard;
