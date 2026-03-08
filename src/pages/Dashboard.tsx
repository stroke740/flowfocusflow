import { useState, useMemo, useEffect, forwardRef } from "react";
import {
  Inbox, CalendarDays, CheckCircle2,
  Calendar, Plus, Search, FolderOpen, User,
  BarChart3, Timer,
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
import { useAuth } from "@/hooks/use-auth";
import { isToday, isBefore, startOfDay, startOfTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Bottom tab bar tabs
const mobileTabs: { id: ViewType | "search" | "projects"; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "search", label: "Search", icon: Search },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "settings", label: "Settings", icon: User },
];

const Dashboard = () => {
  const [view, setView] = useState<ViewType | "project">("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Dialogs
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

  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();
  const { data: projects = [] } = useProjects();
  const { data: taskCounts = new Map() } = useProjectTaskCounts();
  const { addProject, updateProject, deleteProject } = useProjectMutations();

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
    setMobileProjectsOpen(false);
    setFilters(DEFAULT_FILTERS);
  };

  const currentTitle =
    view === "settings" ? ""
    : view === "project" && selectedProject ? selectedProject.name
    : mobileTabs.find((v) => v.id === view)?.label
      || (view === "upcoming" ? "Upcoming" : view === "completed" ? "Completed" : view === "analytics" ? "Analytics" : "Tasks");

  const showAddTask = !["completed", "settings", "analytics"].includes(view);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden safe-area-top">
      {/* ===== HEADER ===== */}
      {view !== "settings" && (
        <header className="h-14 flex items-center gap-2 px-4 border-b border-border/60 flex-shrink-0 bg-card/80 backdrop-blur-md">
          {view === "project" && selectedProject && (
            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: selectedProject.color }} />
          )}
          <h1 className="text-lg font-bold flex-1 truncate">{currentTitle}</h1>

          <div className="flex items-center gap-0.5">
            {overdueCount > 0 && (
              <button
                onClick={() => setOverdueReviewOpen(true)}
                className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold"
              >
                {overdueCount} overdue
              </button>
            )}
            <button
              onClick={() => { setFocusTask(null); setFocusOpen(true); }}
              className="p-2.5 rounded-xl text-muted-foreground active:bg-muted transition-colors"
            >
              <Timer size={20} />
            </button>
            <NotificationCenter onNavigateToTask={handleNavigateToTask} />
          </div>
        </header>
      )}

      {/* ===== CONTENT ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 pb-28">
          {view !== "completed" && view !== "project" && view !== "settings" && view !== "analytics" && (
            <div className="mb-3">
              <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projectNames} />
            </div>
          )}

          {view === "settings" ? (
            <SettingsPage />
          ) : isLoading && view !== "project" ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view + (selectedProjectId || "")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {view === "today" && (
                  <TodayView tasks={filteredTasks} completedToday={completedToday} onEditTask={handleSelectTask} />
                )}
                {view === "inbox" && (
                  <AllTasksView
                    tasks={filteredTasks}
                    onEditTask={handleSelectTask}
                    emptyIcon={<Inbox size={48} className="text-muted-foreground/15" />}
                    emptyTitle="Inbox zero 🎯"
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

      {/* ===== TASK DETAIL — Bottom Sheet ===== */}
      <Sheet open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 overflow-hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-2 mb-1" />
          <div className="h-[calc(100%-16px)] overflow-y-auto">
            {editingTask && (
              <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} projects={projects} tags={tags} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== FAB (Floating Action Button) ===== */}
      {showAddTask && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.2 }}
          onClick={() => setMobileAddOpen(true)}
          className="fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+8px)] z-30 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-glow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Add task sheet */}
      <AddTaskInput asSheet sheetOpen={mobileAddOpen} onSheetOpenChange={setMobileAddOpen} />

      {/* ===== BOTTOM TAB BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
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
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects sheet */}
      <Sheet open={mobileProjectsOpen} onOpenChange={setMobileProjectsOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[75vh]">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-1 mb-4" />
          <SheetHeader>
            <SheetTitle className="text-left text-lg">Projects</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {projects.map((project) => {
              const counts = taskCounts.get(project.id);
              const activeCount = counts ? counts.total - counts.completed : 0;
              return (
                <button
                  key={project.id}
                  onClick={() => switchView("project", project.id)}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl hover:bg-muted/80 active:bg-muted transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: project.color + "18" }}
                  >
                    {project.icon}
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">{project.name}</span>
                  {activeCount > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => { setMobileProjectsOpen(false); setEditingProject(null); setProjectFormOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus size={18} />
              </div>
              <span className="text-sm font-semibold">New Project</span>
            </button>

            {/* Quick links */}
            <div className="pt-4 border-t border-border/50 mt-4 space-y-0.5">
              {[
                { icon: Calendar, label: "Upcoming", action: () => switchView("upcoming") },
                { icon: CheckCircle2, label: "Completed", action: () => switchView("completed") },
                { icon: BarChart3, label: "Analytics", action: () => switchView("analytics" as any) },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => { setMobileProjectsOpen(false); action(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-muted-foreground hover:bg-muted/80 active:bg-muted transition-colors"
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{label}</span>
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
