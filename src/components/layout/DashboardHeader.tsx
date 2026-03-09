import { motion } from "framer-motion";
import { Moon, Sun, Search, Timer } from "lucide-react";
import { format } from "date-fns";
import { WalletButton } from "@/components/wallet/WalletButton";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DailyProgressRing from "@/components/home/DailyProgressRing";
import { Task } from "@/types/task";
import { Project } from "@/hooks/use-projects";

interface DashboardHeaderProps {
  view: string;
  currentTitle: string;
  isDark: boolean;
  onToggleDarkMode: () => void;
  onSearchOpen: () => void;
  onFocusOpen: () => void;
  onNavigateToTask: (taskId: string) => void;
  todayTasks: Task[];
  completedToday: Task[];
  completedTasks: Task[];
  activeTasks: Task[];
  projects: Project[];
  overdueCount: number;
  onOverdueReviewOpen: () => void;
  homeProjectFilter: string | null;
  onProjectFilter: (id: string | null) => void;
  selectedProject?: Project | null;
}

export function DashboardHeader({
  view,
  currentTitle,
  isDark,
  onToggleDarkMode,
  onSearchOpen,
  onFocusOpen,
  onNavigateToTask,
  todayTasks,
  completedToday,
  completedTasks,
  activeTasks,
  projects,
  overdueCount,
  onOverdueReviewOpen,
  homeProjectFilter,
  onProjectFilter,
  selectedProject,
}: DashboardHeaderProps) {
  const showGreetingHeader = view === "today" || view === "inbox";

  if (view === "settings") return null;

  const HeaderButtons = () => (
    <div className="flex items-center gap-1">
      {overdueCount > 0 && !showGreetingHeader && (
        <button
          onClick={onOverdueReviewOpen}
          className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold"
        >
          {overdueCount} overdue
        </button>
      )}
      <button
        onClick={onToggleDarkMode}
        className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      </button>
      <button
        onClick={onSearchOpen}
        className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Search size={16} strokeWidth={1.8} />
      </button>
      <button
        onClick={onFocusOpen}
        className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Timer size={16} strokeWidth={1.8} />
      </button>
      <NotificationCenter onNavigateToTask={onNavigateToTask} />
      <WalletButton />
    </div>
  );

  if (showGreetingHeader) {
    return (
      <header className="flex-shrink-0 bg-background">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <motion.h1
                className="text-[24px] font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {currentTitle}
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
            <HeaderButtons />
          </div>

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
                  onClick={onOverdueReviewOpen}
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
              total={completedToday.length + activeTasks.length}
              completedTasks={completedTasks}
              projects={projects}
              activeProjectFilter={homeProjectFilter}
              onProjectFilter={onProjectFilter}
              taskCount={activeTasks.length}
            />
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="flex-shrink-0 bg-background">
      <div className="h-13 flex items-center gap-3 px-5 border-b border-border">
        {view === "project" && selectedProject && (
          <span
            className="w-3 h-3 rounded-[5px] flex-shrink-0"
            style={{ backgroundColor: selectedProject.color }}
          />
        )}
        <h1 className="text-[17px] font-bold flex-1 truncate tracking-tight">{currentTitle}</h1>
        <HeaderButtons />
      </div>
    </header>
  );
}
