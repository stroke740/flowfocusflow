import { useMemo, useState } from "react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import TaskList from "../tasks/TaskList";

interface CompletedViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const CompletedView = ({ tasks, onEditTask }: CompletedViewProps) => {
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
      <div className="text-center py-20">
        <Trophy size={40} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No completed tasks yet. Finish one to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center gap-3">
        <Trophy size={20} className="text-success flex-shrink-0" />
        <p className="text-sm">
          You've completed <span className="font-bold text-foreground">{thisMonthCount}</span> tasks this month 🎉
        </p>
      </div>

      {/* Grouped timeline */}
      {grouped.map(({ label, tasks: groupTasks }) => (
        <div key={label}>
          <button
            onClick={() => toggleGroup(label)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform", expandedGroups.has(label) && "rotate-180")}
            />
            {label}
            <span className="text-muted-foreground/60 font-normal">({groupTasks.length})</span>
          </button>
          {expandedGroups.has(label) && (
            <TaskList tasks={groupTasks} onEditTask={onEditTask} />
          )}
        </div>
      ))}
    </div>
  );
};

export default CompletedView;
