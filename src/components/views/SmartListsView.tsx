import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle, Flag, Minus, Zap, ChevronRight } from "lucide-react";
import { isToday, isBefore, startOfDay, endOfWeek, isWithinInterval, startOfWeek, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import TaskList from "@/components/tasks/TaskList";

interface SmartListsViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

type SmartListId = "overdue" | "today" | "this_week" | "high_priority" | "no_date";

const SMART_LISTS = [
  { id: "overdue" as const, label: "Overdue", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  { id: "today" as const, label: "Due Today", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
  { id: "this_week" as const, label: "This Week", icon: Calendar, color: "text-success", bg: "bg-success/10" },
  { id: "high_priority" as const, label: "High Priority", icon: Flag, color: "text-warning", bg: "bg-warning/10" },
  { id: "no_date" as const, label: "No Due Date", icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
];

export default function SmartListsView({ tasks, onEditTask }: SmartListsViewProps) {
  const [activeList, setActiveList] = useState<SmartListId | null>(null);

  const now = startOfDay(new Date());
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const lists = useMemo(() => ({
    overdue: tasks.filter(t => t.due_date && isBefore(new Date(t.due_date), now) && !isToday(new Date(t.due_date))),
    today: tasks.filter(t => t.due_date && isToday(new Date(t.due_date))),
    this_week: tasks.filter(t => t.due_date && isWithinInterval(new Date(t.due_date), { start: now, end: weekEnd })),
    high_priority: tasks.filter(t => t.priority === "p1" || t.priority === "p2"),
    no_date: tasks.filter(t => !t.due_date),
  }), [tasks, now, weekEnd]);

  if (activeList) {
    const config = SMART_LISTS.find(s => s.id === activeList)!;
    const listTasks = lists[activeList];
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveList(null)} className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Smart Lists
        </button>
        <div className="flex items-center gap-2.5">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
            <config.icon size={18} className={config.color} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold">{config.label}</h2>
            <p className="text-[11px] text-muted-foreground">{listTasks.length} tasks</p>
          </div>
        </div>
        {listTasks.length > 0 ? (
          <TaskList tasks={listTasks} onEditTask={onEditTask} enableDragDrop={false} />
        ) : (
          <p className="text-center text-muted-foreground text-[13px] py-12">No tasks here 🎉</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {SMART_LISTS.map((list, i) => {
        const count = lists[list.id].length;
        return (
          <motion.button
            key={list.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveList(list.id)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", list.bg)}>
              <list.icon size={18} className={list.color} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13.5px] font-semibold">{list.label}</p>
              <p className="text-[11px] text-muted-foreground">{count} {count === 1 ? "task" : "tasks"}</p>
            </div>
            {count > 0 && (
              <span className={cn("min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center", list.bg, list.color)}>
                {count}
              </span>
            )}
            <ChevronRight size={14} className="text-muted-foreground/40" />
          </motion.button>
        );
      })}
    </div>
  );
}
