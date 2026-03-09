import { useState, useMemo, useEffect, useCallback } from "react";
import { useApplyPreferences } from "@/hooks/use-apply-preferences";
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
  Home, Sun, Calendar, Grid3X3, Layout,
  Sparkles, Download, BarChart2,
} from "lucide-react";
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
import OverdueReviewModal from "@/components/notifications/OverdueReviewModal";
import CommandPalette, { addRecentTask } from "@/components/search/CommandPalette";
import SettingsPage from "@/components/settings/SettingsPage";
import FocusMode from "@/components/focus/FocusMode";
import AnalyticsView from "@/components/views/AnalyticsView";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { isToday, isBefore, startOfDay, startOfTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Extracted layout components
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { ProjectsSheet } from "@/components/layout/ProjectsSheet";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

type ExtendedView = ViewType | "project" | "calendar" | "matrix";

const Dashboard = () => {
  useApplyPreferences();
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

  const [dailyPlanningOpen, setDailyPlanningOpen] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: prefs } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const qc = useQueryClient();
  const { requestPermission } = usePushNotifications();

  useEffect(() => {
    if (prefs?.push_notifications) requestPermission();
  }, [prefs?.push_notifications, requestPermission]);

  const isDark = prefs?.theme === "dark" || (prefs?.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (!prefs) return;
    const root = document.documentElement;
    if (prefs.theme === "dark") root.classList.add("dark");
    else if (prefs.theme === "light") root.classList.remove("dark");
    else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, [prefs?.theme]);

  const toggleDarkMode = () => {
    updatePrefs.mutate({ theme: isDark ? "light" : "dark" } as any);
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
    : view === "inbox" ? (homeProjectFilter ? activeTasks.filter((t) => t.project_id === homeProjectFilter) : activeTasks)
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
      if (!sessionStorage.getItem("overdue_dismissed")) setOverdueReviewOpen(true);
    }
  }, [overdueCount, loadingActive]);

  const handleNavigateToTask = useCallback((taskId: string) => {
    const task = [...activeTasks, ...completedTasks].find((t) => t.id === taskId);
    if (task) { addRecentTask(task.id); setEditingTask(task); }
  }, [activeTasks, completedTasks]);

  const handleSelectTask = useCallback((task: Task) => {
    addRecentTask(task.id);
    setEditingTask(task);
  }, []);

  const viewOrder: Record<string, number> = { inbox: 0, today: 1, upcoming: 2, all: 3, completed: 4, project: 5, analytics: 6, settings: 7, calendar: 8, matrix: 9 };
  const switchView = useCallback((v: ExtendedView, projectId?: string) => {
    setSlideDirection((prev) => {
      const oldIdx = viewOrder[view] ?? 0;
      const newIdx = viewOrder[v] ?? 0;
      return newIdx > oldIdx ? 1 : newIdx < oldIdx ? -1 : 0;
    });
    setView(v);
    setSelectedProjectId(projectId || null);
    setMobileProjectsOpen(false);
    setFilters(DEFAULT_FILTERS);
  }, [view]);

  const currentTitle =
    view === "settings" ? ""
    : view === "calendar" ? "Calendar"
    : view === "matrix" ? "Priority Matrix"
    : view === "project" && selectedProject ? selectedProject.name
    : view === "inbox" ? "Home"
    : view === "today" ? "Today"
    : view === "upcoming" ? "Upcoming"
    : view === "completed" ? "Completed"
    : view === "analytics" ? "Analytics"
    : "Tasks";

  const showAddTask = !["completed", "settings", "analytics", "calendar", "matrix"].includes(view);

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

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === "projects") setMobileProjectsOpen(true);
    else if (tabId === "settings") switchView("settings" as any);
    else switchView(tabId as ViewType);
  }, [switchView]);

  if (showSplash) {
    return <SplashScreen onComplete={() => { sessionStorage.setItem("focusflow_splash_done", "1"); setShowSplash(false); }} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => { localStorage.setItem("focusflow_onboarded", "1"); setShowOnboarding(false); }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden safe-area-top">
      <UndoToast />

      <DashboardHeader
        view={view}
        currentTitle={currentTitle}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        onSearchOpen={() => setSearchOpen(true)}
        onFocusOpen={() => { setFocusTask(null); setFocusOpen(true); }}
        onNavigateToTask={handleNavigateToTask}
        todayTasks={todayTasks}
        completedToday={completedToday}
        completedTasks={completedTasks}
        activeTasks={activeTasks}
        projects={projects}
        overdueCount={overdueCount}
        onOverdueReviewOpen={() => setOverdueReviewOpen(true)}
        homeProjectFilter={homeProjectFilter}
        onProjectFilter={setHomeProjectFilter}
        selectedProject={selectedProject}
      />

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

      {/* Task Detail Sheet */}
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
        <FloatingActionButton
          isOpen={mobileAddOpen}
          onToggle={() => setMobileAddOpen(!mobileAddOpen)}
          onTemplates={() => { setMobileAddOpen(false); setTemplatesOpen(true); }}
          onFocusTimer={() => { setMobileAddOpen(false); setFocusTask(null); setFocusOpen(true); }}
          onAddTask={() => { setMobileAddOpen(false); setFabTaskOpen(true); }}
        />
      )}

      <AddTaskInput asSheet sheetOpen={fabTaskOpen} onSheetOpenChange={setFabTaskOpen} />

      {/* Bottom Tab Bar */}
      <BottomTabBar
        view={view}
        selectedProjectId={selectedProjectId}
        mobileProjectsOpen={mobileProjectsOpen}
        inboxCount={inboxCount}
        todayTasksCount={todayTasks.length}
        onTabClick={handleTabClick}
      />

      {/* Projects Sheet */}
      <ProjectsSheet
        open={mobileProjectsOpen}
        onOpenChange={setMobileProjectsOpen}
        projects={projects}
        taskCounts={taskCounts}
        onSelectProject={(id) => switchView("project", id)}
        onAddProject={() => { setMobileProjectsOpen(false); setEditingProject(null); setProjectFormOpen(true); }}
        onNavigate={(v) => { setMobileProjectsOpen(false); switchView(v as ExtendedView); }}
      />

      {/* Install Prompt */}
      <InstallPrompt />

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
