import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search, Command, ArrowUp, ArrowDown, CornerDownLeft, X,
  CalendarDays, Inbox, Calendar, List, CheckCircle2, Moon, Sun,
  Plus, Clock, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, ViewType, PRIORITY_CONFIG } from "@/types/task";
import { Project } from "@/hooks/use-projects";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const RECENT_SEARCHES_KEY = "focusflow_recent_searches";
const RECENT_TASKS_KEY = "focusflow_recent_tasks";
const MAX_RECENT = 10;
const MAX_RECENT_TASKS = 5;

interface CommandAction {
  id: string;
  label: string;
  icon: typeof Inbox;
  category: "action";
  onSelect: () => void;
}

interface SearchResult {
  type: "task" | "project" | "action";
  id: string;
  title: string;
  subtitle?: string;
  icon?: typeof Inbox;
  color?: string;
  priority?: string;
  dueDate?: string | null;
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
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch { return []; }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function getRecentTaskIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_TASKS_KEY) || "[]");
  } catch { return []; }
}

export function addRecentTask(taskId: string) {
  const recent = getRecentTaskIds().filter((id) => id !== taskId);
  recent.unshift(taskId);
  localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_TASKS)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

const CommandPalette = ({
  open, onOpenChange, tasks, projects,
  onSelectTask, onNavigateView, onNavigateProject, onCreateProject,
  currentProjectName,
}: Props) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build actions
  const actions: CommandAction[] = useMemo(() => [
    { id: "view-today", label: "Go to Today", icon: CalendarDays, category: "action", onSelect: () => { onNavigateView("today"); onOpenChange(false); } },
    { id: "view-inbox", label: "Go to Inbox", icon: Inbox, category: "action", onSelect: () => { onNavigateView("inbox"); onOpenChange(false); } },
    { id: "view-upcoming", label: "Go to Upcoming", icon: Calendar, category: "action", onSelect: () => { onNavigateView("upcoming"); onOpenChange(false); } },
    { id: "view-all", label: "Go to All Tasks", icon: List, category: "action", onSelect: () => { onNavigateView("all"); onOpenChange(false); } },
    { id: "view-completed", label: "Go to Completed", icon: CheckCircle2, category: "action", onSelect: () => { onNavigateView("completed"); onOpenChange(false); } },
    { id: "new-project", label: "New Project", icon: Plus, category: "action", onSelect: () => { onCreateProject(); onOpenChange(false); } },
  ], [onNavigateView, onOpenChange, onCreateProject]);

  // Fuse instances
  const taskFuse = useMemo(() => new Fuse(tasks, {
    keys: ["title", "description", "project"],
    threshold: 0.4,
    includeMatches: true,
  }), [tasks]);

  const projectFuse = useMemo(() => new Fuse(projects, {
    keys: ["name"],
    threshold: 0.4,
    includeMatches: true,
  }), [projects]);

  const actionFuse = useMemo(() => new Fuse(actions, {
    keys: ["label"],
    threshold: 0.3,
  }), [actions]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const taskResults = taskFuse.search(query, { limit: 5 }).map((r) => ({
      type: "task" as const,
      id: r.item.id,
      title: r.item.title,
      subtitle: r.item.project || undefined,
      priority: r.item.priority,
      dueDate: r.item.due_date,
      onSelect: () => { onSelectTask(r.item); addRecentTask(r.item.id); addRecentSearch(query); onOpenChange(false); },
    }));

    const projectResults = projectFuse.search(query, { limit: 2 }).map((r) => ({
      type: "project" as const,
      id: r.item.id,
      title: r.item.name,
      icon: FolderOpen,
      color: r.item.color,
      onSelect: () => { onNavigateProject(r.item.id); addRecentSearch(query); onOpenChange(false); },
    }));

    const actionResults = actionFuse.search(query, { limit: 2 }).map((r) => ({
      type: "action" as const,
      id: r.item.id,
      title: r.item.label,
      icon: r.item.icon,
      onSelect: () => { r.item.onSelect(); addRecentSearch(query); },
    }));

    return [...taskResults, ...projectResults, ...actionResults];
  }, [query, taskFuse, projectFuse, actionFuse, onSelectTask, onNavigateProject, onOpenChange]);

  // Recent items when query is empty
  const recentItems = useMemo((): SearchResult[] => {
    if (query.trim()) return [];
    const recentTaskIds = getRecentTaskIds();
    const recentTasks = recentTaskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({
        type: "task" as const,
        id: t!.id,
        title: t!.title,
        subtitle: t!.project || undefined,
        priority: t!.priority,
        dueDate: t!.due_date,
        onSelect: () => { onSelectTask(t!); onOpenChange(false); },
      }));
    return recentTasks;
  }, [query, tasks, onSelectTask, onOpenChange]);

  const allItems = query.trim() ? results : recentItems;

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
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
    }
  }, [allItems, selectedIndex]);

  const recentSearches = getRecentSearches();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentProjectName ? `Search within ${currentProjectName}…` : "Search tasks, projects, or commands…"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-md hover:bg-muted">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results / Recent */}
        <div className="max-h-80 overflow-y-auto" ref={listRef}>
          {/* Empty state with recent searches */}
          {!query.trim() && recentSearches.length > 0 && recentItems.length === 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recent Searches</span>
                <button onClick={() => { clearRecentSearches(); setQuery(""); }} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              </div>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Clock size={12} />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Recent tasks header */}
          {!query.trim() && recentItems.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recently Viewed</span>
            </div>
          )}

          {/* Task results header */}
          {query.trim() && results.filter((r) => r.type === "task").length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Tasks</span>
            </div>
          )}

          {/* Results */}
          {allItems.map((item, index) => {
            // Show section headers between types
            const prevType = index > 0 ? allItems[index - 1].type : null;
            const showProjectHeader = query.trim() && item.type === "project" && prevType !== "project";
            const showActionHeader = query.trim() && item.type === "action" && prevType !== "action";

            return (
              <div key={item.id}>
                {showProjectHeader && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Projects</span>
                  </div>
                )}
                {showActionHeader && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</span>
                  </div>
                )}
                <button
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  {/* Icon / color dot */}
                  {item.type === "task" && item.priority && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]?.color || "transparent" }}
                    />
                  )}
                  {item.type === "project" && item.color && (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  {item.icon && item.type === "action" && <item.icon size={15} className="text-muted-foreground flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>}
                  </div>

                  {item.dueDate && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(item.dueDate), "MMM d")}
                    </span>
                  )}

                  {selectedIndex === index && (
                    <CornerDownLeft size={12} className="text-muted-foreground/50 flex-shrink-0" />
                  )}
                </button>
              </div>
            );
          })}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div className="text-center py-8 px-4">
              <Search size={24} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> Navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Select</span>
          <span className="flex items-center gap-1">ESC Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
