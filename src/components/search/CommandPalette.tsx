import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import {
  Search, X, CalendarDays, Inbox, Calendar, List, CheckCircle2,
  Plus, Clock, FolderOpen, Sparkles, ArrowRight, Hash, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, ViewType, PRIORITY_CONFIG, TaskPriority } from "@/types/task";
import { Project } from "@/hooks/use-projects";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

const RECENT_SEARCHES_KEY = "focusflow_recent_searches";
const RECENT_TASKS_KEY = "focusflow_recent_tasks";
const MAX_RECENT = 8;
const MAX_RECENT_TASKS = 5;

interface SearchResult {
  type: "task" | "project" | "action";
  id: string;
  title: string;
  subtitle?: string;
  icon?: typeof Inbox;
  color?: string;
  priority?: string;
  dueDate?: string | null;
  status?: string;
  onSelect: () => void;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onNavigateView: (view: ViewType) => void;
  onNavigateProject: (projectId: string) => void;
  onCreateProject: () => void;
  currentProjectName?: string;
}

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); }
  catch { return []; }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function getRecentTaskIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_TASKS_KEY) || "[]"); }
  catch { return []; }
}

export function addRecentTask(taskId: string) {
  const recent = getRecentTaskIds().filter((id) => id !== taskId);
  recent.unshift(taskId);
  localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_TASKS)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

function formatDueLabel(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isToday(d)) return { text: "Today", urgent: false };
  if (isTomorrow(d)) return { text: "Tomorrow", urgent: false };
  if (isPast(d)) return { text: "Overdue", urgent: true };
  return { text: format(d, "MMM d"), urgent: false };
}

type FilterType = "all" | "tasks" | "projects" | "actions";

const QUICK_FILTERS: { id: FilterType; label: string; icon: typeof Search }[] = [
  { id: "all", label: "All", icon: Search },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "actions", label: "Actions", icon: Sparkles },
];

const CommandPalette = ({
  open, onOpenChange, tasks, projects,
  onSelectTask, onNavigateView, onNavigateProject, onCreateProject,
  currentProjectName,
}: Props) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(() => [
    { id: "view-today", label: "Go to Today", icon: CalendarDays, onSelect: () => { onNavigateView("today"); onOpenChange(false); } },
    { id: "view-inbox", label: "Go to Inbox", icon: Inbox, onSelect: () => { onNavigateView("inbox"); onOpenChange(false); } },
    { id: "view-upcoming", label: "Go to Upcoming", icon: Calendar, onSelect: () => { onNavigateView("upcoming"); onOpenChange(false); } },
    { id: "view-completed", label: "Go to Completed", icon: CheckCircle2, onSelect: () => { onNavigateView("completed"); onOpenChange(false); } },
    { id: "new-project", label: "Create New Project", icon: Plus, onSelect: () => { onCreateProject(); onOpenChange(false); } },
  ], [onNavigateView, onOpenChange, onCreateProject]);

  const taskFuse = useMemo(() => new Fuse(tasks, {
    keys: [{ name: "title", weight: 2 }, { name: "description", weight: 1 }, { name: "project", weight: 0.5 }],
    threshold: 0.35,
    includeScore: true,
  }), [tasks]);

  const projectFuse = useMemo(() => new Fuse(projects, {
    keys: ["name"],
    threshold: 0.35,
    includeScore: true,
  }), [projects]);

  const actionFuse = useMemo(() => new Fuse(actions, {
    keys: ["label"],
    threshold: 0.3,
  }), [actions]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const items: SearchResult[] = [];

    if (filterType === "all" || filterType === "tasks") {
      taskFuse.search(query, { limit: 8 }).forEach((r) => {
        items.push({
          type: "task",
          id: r.item.id,
          title: r.item.title,
          subtitle: r.item.project || undefined,
          priority: r.item.priority,
          dueDate: r.item.due_date,
          status: r.item.status,
          onSelect: () => { onSelectTask(r.item); addRecentTask(r.item.id); addRecentSearch(query); onOpenChange(false); },
        });
      });
    }

    if (filterType === "all" || filterType === "projects") {
      projectFuse.search(query, { limit: 4 }).forEach((r) => {
        items.push({
          type: "project",
          id: r.item.id,
          title: r.item.name,
          icon: FolderOpen,
          color: r.item.color,
          onSelect: () => { onNavigateProject(r.item.id); addRecentSearch(query); onOpenChange(false); },
        });
      });
    }

    if (filterType === "all" || filterType === "actions") {
      actionFuse.search(query, { limit: 3 }).forEach((r) => {
        items.push({
          type: "action",
          id: r.item.id,
          title: r.item.label,
          icon: r.item.icon,
          onSelect: () => { r.item.onSelect(); addRecentSearch(query); },
        });
      });
    }

    return items;
  }, [query, filterType, taskFuse, projectFuse, actionFuse, onSelectTask, onNavigateProject, onOpenChange]);

  const recentItems = useMemo((): SearchResult[] => {
    if (query.trim()) return [];
    const recentTaskIds = getRecentTaskIds();
    return recentTaskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({
        type: "task" as const,
        id: t!.id,
        title: t!.title,
        subtitle: t!.project || undefined,
        priority: t!.priority,
        dueDate: t!.due_date,
        status: t!.status,
        onSelect: () => { onSelectTask(t!); onOpenChange(false); },
      }));
  }, [query, tasks, onSelectTask, onOpenChange]);

  const allItems = query.trim() ? results : recentItems;

  // Grouped results
  const groupedResults = useMemo(() => {
    const groups: { label: string; items: (SearchResult & { globalIndex: number })[] }[] = [];
    let globalIndex = 0;

    if (!query.trim() && recentItems.length > 0) {
      groups.push({
        label: "Recent",
        items: recentItems.map((item) => ({ ...item, globalIndex: globalIndex++ })),
      });
    }

    if (query.trim()) {
      const taskItems = results.filter((r) => r.type === "task");
      const projectItems = results.filter((r) => r.type === "project");
      const actionItems = results.filter((r) => r.type === "action");

      if (taskItems.length > 0) {
        groups.push({ label: "Tasks", items: taskItems.map((item) => ({ ...item, globalIndex: globalIndex++ })) });
      }
      if (projectItems.length > 0) {
        groups.push({ label: "Projects", items: projectItems.map((item) => ({ ...item, globalIndex: globalIndex++ })) });
      }
      if (actionItems.length > 0) {
        groups.push({ label: "Quick Actions", items: actionItems.map((item) => ({ ...item, globalIndex: globalIndex++ })) });
      }
    }

    return groups;
  }, [query, results, recentItems]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setFilterType("all");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query, filterType]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].onSelect();
    } else if (e.key === "Backspace" && !query) {
      onOpenChange(false);
    }
  }, [allItems, selectedIndex, query, onOpenChange]);

  const recentSearches = getRecentSearches();
  const totalResults = allItems.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 h-[85vh] overflow-hidden">
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-2.5 mb-1" />

        {/* Search header */}
        <div className="px-4 pt-2 pb-3">
          <div className="flex items-center gap-3 bg-muted/60 rounded-2xl px-4 py-3">
            <Search size={18} className="text-muted-foreground/60 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, projects…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="p-1 rounded-full bg-muted-foreground/15 active:bg-muted-foreground/25"
              >
                <X size={12} className="text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        {query.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    filterType === f.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground active:bg-muted"
                  )}
                >
                  <f.icon size={12} />
                  {f.label}
                  {f.id !== "all" && query.trim() && (
                    <span className="text-[10px] opacity-70">
                      {f.id === "tasks" ? results.filter((r) => r.type === "task").length
                        : f.id === "projects" ? results.filter((r) => r.type === "project").length
                        : results.filter((r) => r.type === "action").length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent searches (when empty) */}
        {!query.trim() && recentSearches.length > 0 && recentItems.length === 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Recent Searches</span>
              <button onClick={() => { clearRecentSearches(); setQuery(""); }} className="text-[11px] text-primary font-medium">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.slice(0, 6).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground active:bg-muted transition-colors"
                >
                  <Clock size={11} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested actions (when empty, no recents) */}
        {!query.trim() && recentSearches.length === 0 && recentItems.length === 0 && (
          <div className="px-4 pb-2">
            <span className="text-xs font-semibold text-muted-foreground block mb-2">Quick Actions</span>
            <div className="space-y-0.5">
              {actions.slice(0, 4).map((action) => (
                <button
                  key={action.id}
                  onClick={action.onSelect}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl active:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-muted/80 flex items-center justify-center">
                    <action.icon size={15} className="text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                  <ArrowRight size={14} className="text-muted-foreground/30 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-2" ref={listRef}>
          {groupedResults.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-3 py-2">
                <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const due = formatDueLabel(item.dueDate || null);
                  const isSelected = selectedIndex === item.globalIndex;

                  return (
                    <motion.button
                      key={item.id}
                      data-index={item.globalIndex}
                      onClick={item.onSelect}
                      onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                      initial={query.trim() ? { opacity: 0, y: 4 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: item.globalIndex * 0.02 }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all",
                        isSelected ? "bg-primary/8 shadow-sm" : "active:bg-muted/60"
                      )}
                    >
                      {/* Left indicator */}
                      {item.type === "task" && item.priority && (
                        <div className="relative">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: PRIORITY_CONFIG[item.priority as TaskPriority]?.color + "20" }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_CONFIG[item.priority as TaskPriority]?.color }}
                            />
                          </div>
                        </div>
                      )}
                      {item.type === "project" && (
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: (item.color || "#6366f1") + "18" }}
                        >
                          <FolderOpen size={14} style={{ color: item.color }} />
                        </div>
                      )}
                      {item.type === "action" && item.icon && (
                        <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                          <item.icon size={14} className="text-primary" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          item.status === "completed" && "line-through text-muted-foreground"
                        )}>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>

                      {/* Right info */}
                      {due && (
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium",
                          due.urgent
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {due.text}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {query.trim() && allItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <Search size={22} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold mb-1">No results found</p>
              <p className="text-xs text-muted-foreground/60">Try a different search term</p>
            </motion.div>
          )}
        </div>

        {/* Result count footer */}
        {query.trim() && totalResults > 0 && (
          <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20">
            <p className="text-[11px] text-muted-foreground/50 text-center font-medium">
              {totalResults} result{totalResults !== 1 ? "s" : ""} found
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CommandPalette;
