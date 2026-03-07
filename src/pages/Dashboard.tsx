import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox, CalendarDays, CheckCircle2, LogOut, Menu,
  Calendar, List, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ViewType, FilterState, DEFAULT_FILTERS, Task } from "@/types/task";
import { useTasks, useTags } from "@/hooks/use-tasks";
import { useFilteredTasks } from "@/hooks/use-filtered-tasks";
import AddTaskInput from "@/components/tasks/AddTaskInput";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import FilterBar from "@/components/tasks/FilterBar";
import TodayView from "@/components/views/TodayView";
import UpcomingView from "@/components/views/UpcomingView";
import AllTasksView from "@/components/views/AllTasksView";
import CompletedView from "@/components/views/CompletedView";
import { isToday, isBefore, startOfTomorrow } from "date-fns";

const views: { id: ViewType; label: string; icon: typeof Inbox }[] = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "all", label: "All Tasks", icon: List },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>("today");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [groupByProject, setGroupByProject] = useState(false);

  const { data: activeTasks = [], isLoading: loadingActive } = useTasks("active");
  const { data: completedTasks = [], isLoading: loadingCompleted } = useTasks("completed");
  const { data: tags = [] } = useTags();

  // Derive today tasks
  const todayTasks = useMemo(
    () =>
      activeTasks.filter(
        (t) => t.due_date && (isToday(new Date(t.due_date)) || isBefore(new Date(t.due_date), startOfTomorrow()))
      ),
    [activeTasks]
  );

  const completedToday = useMemo(
    () =>
      completedTasks.filter(
        (t) => t.completed_at && isToday(new Date(t.completed_at))
      ),
    [completedTasks]
  );

  // Get all unique projects
  const projects = useMemo(
    () => [...new Set([...activeTasks, ...completedTasks].map((t) => t.project).filter(Boolean))] as string[],
    [activeTasks, completedTasks]
  );

  // Apply filters to the current view's tasks
  const baseTasks = view === "completed" ? completedTasks : view === "today" ? todayTasks : activeTasks;
  const filteredTasks = useFilteredTasks(baseTasks, filters);
  const isLoading = view === "completed" ? loadingCompleted : loadingActive;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar overlay on mobile */}
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
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setView(v.id);
                setSidebarOpen(false);
                setFilters(DEFAULT_FILTERS);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                view === v.id
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-bold">
              {views.find((v) => v.id === view)?.label}
            </h1>

            {/* Group by project toggle for All Tasks */}
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

          {/* Filter bar */}
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} tags={tags} projects={projects} />
          </div>

          {/* Add task (not on completed view) */}
          {view !== "completed" && (
            <div className="mb-4">
              <AddTaskInput />
            </div>
          )}

          {/* Content */}
          {isLoading ? (
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
              {view === "inbox" && (
                <AllTasksView tasks={filteredTasks} onEditTask={setEditingTask} />
              )}
              {view === "upcoming" && (
                <UpcomingView tasks={filteredTasks} onEditTask={setEditingTask} />
              )}
              {view === "all" && (
                <AllTasksView tasks={filteredTasks} onEditTask={setEditingTask} groupByProject={groupByProject} />
              )}
              {view === "completed" && (
                <CompletedView tasks={filteredTasks} onEditTask={setEditingTask} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Detail panel */}
      {editingTask && <TaskDetailPanel task={editingTask} onClose={() => setEditingTask(null)} />}
      {editingTask && <div className="fixed inset-0 z-30 bg-foreground/10" onClick={() => setEditingTask(null)} />}
    </div>
  );
};

export default Dashboard;
