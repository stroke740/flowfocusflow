import { motion } from "framer-motion";
import { Home, CalendarDays, BarChart3, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType } from "@/types/task";

const mobileTabs = [
  { id: "inbox", label: "Home", icon: Home },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "settings", label: "Me", icon: User },
] as const;

interface BottomTabBarProps {
  view: string;
  selectedProjectId: string | null;
  mobileProjectsOpen: boolean;
  inboxCount: number;
  todayTasksCount: number;
  onTabClick: (tabId: string) => void;
}

export function BottomTabBar({
  view,
  selectedProjectId,
  mobileProjectsOpen,
  inboxCount,
  todayTasksCount,
  onTabClick,
}: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/40 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 h-[58px]">
        {mobileTabs.map((tab) => {
          const isActive =
            tab.id === "projects"
              ? view === "project" || mobileProjectsOpen
              : tab.id === "settings"
                ? view === "settings"
                : view === tab.id && !selectedProjectId;

          const badge =
            tab.id === "inbox" && inboxCount > 0
              ? inboxCount
              : tab.id === "today" && todayTasksCount > 0
                ? todayTasksCount
                : null;

          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
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
              <span
                className={cn(
                  "text-[9px] relative z-10 transition-all duration-200 tracking-wide",
                  isActive ? "font-bold text-primary" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
