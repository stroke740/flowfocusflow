import { useMemo, useState, forwardRef } from "react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";

interface CompletedViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const CompletedView = forwardRef<HTMLDivElement, CompletedViewProps>(({ tasks, onEditTask }, ref) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Today", "Yesterday"]));

  const grouped = useMemo(() => {
    const groups: { label: string; tasks: Task[] }[] = [];
    const sorted = [...tasks].sort(
      (a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()
    );

    const buckets: Record<string, Task[]> = {};
    for (const t of sorted) {
      const d = new Date(t.completed_at || t.updated_at);
      let label: string;
      if (isToday(d)) label = "Today";
      else if (isYesterday(d)) label = "Yesterday";
      else if (isThisWeek(d, { weekStartsOn: 1 })) label = "This Week";
      else if (isThisMonth(d)) label = "This Month";
      else label = format(d, "MMMM yyyy");

      if (!buckets[label]) buckets[label] = [];
      buckets[label].push(t);
    }

    for (const [label, tasks] of Object.entries(buckets)) {
      groups.push({ label, tasks });
    }
    return groups;
  }, [tasks]);

  const thisMonthCount = tasks.filter(
    (t) => t.completed_at && isThisMonth(new Date(t.completed_at))
  ).length;

  const toggleGroup = (label: string) => {
    const next = new Set(expandedGroups);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setExpandedGroups(next);
  };

  if (tasks.length === 0) {
    return (
      <div ref={ref} className="text-center py-24">
        <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/20" />
        <h3 className="text-base font-bold mb-1">No completed tasks yet</h3>
        <p className="text-muted-foreground text-sm">Finish one to see it here!</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-5">
      {/* Stats header */}
      <div className="bg-success/5 border border-success/15 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
          <Trophy size={20} className="text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold">{thisMonthCount}</p>
          <p className="text-xs text-muted-foreground">tasks this month</p>
        </div>
      </div>

      {/* Grouped timeline */}
      {grouped.map(({ label, tasks: groupTasks }) => (
        <div key={label}>
          <button
            onClick={() => toggleGroup(label)}
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 py-1 active:text-foreground transition-colors"
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform duration-200", expandedGroups.has(label) && "rotate-180")}
            />
            {label}
            <span className="text-muted-foreground/40 font-normal">({groupTasks.length})</span>
          </button>
          {expandedGroups.has(label) && (
            <TaskList tasks={groupTasks} onEditTask={onEditTask} />
          )}
        </div>
      ))}
    </div>
  );
});

CompletedView.displayName = "CompletedView";

export default CompletedView;
