import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Trophy } from "lucide-react";
import { format, subDays, isSameDay, startOfDay, eachDayOfInterval } from "date-fns";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface Props {
  completed: number;
  total: number;
  completedTasks: Task[];
  projects: { id: string; name: string; color: string; icon: string }[];
  activeProjectFilter: string | null;
  onProjectFilter: (id: string | null) => void;
  taskCount: number;
}

const DailyProgressRing = ({
  completed, total, completedTasks, projects,
  activeProjectFilter, onProjectFilter, taskCount,
}: Props) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 40;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Current streak
  const streak = useMemo(() => {
    let count = 0;
    let day = startOfDay(new Date());
    const todayDone = completedTasks.some(
      (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
    );
    if (!todayDone) day = subDays(day, 1);
    while (true) {
      const has = completedTasks.some(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      );
      if (!has) break;
      count++;
      day = subDays(day, 1);
    }
    return count;
  }, [completedTasks]);

  // Best streak
  const bestStreak = useMemo(() => {
    if (completedTasks.length === 0) return 0;
    const days = new Set(
      completedTasks
        .filter((t) => t.completed_at)
        .map((t) => format(new Date(t.completed_at!), "yyyy-MM-dd"))
    );
    const sorted = Array.from(days).sort();
    let max = 0, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { cur++; } else { cur = 1; }
      max = Math.max(max, cur);
    }
    return Math.max(max, cur);
  }, [completedTasks]);

  // Weekly average
  const weeklyAvg = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const totalDone = days.reduce((sum, day) => {
      return sum + completedTasks.filter(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      ).length;
    }, 0);
    return Math.round((totalDone / 7) * 100);
  }, [completedTasks]);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Progress Ring */}
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{pct}%</span>
          <span className="text-[11px] text-muted-foreground">
            {completed}/{total} today
          </span>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        <StatPill
          icon={<Flame size={14} className="text-warning" />}
          value={`${streak}d`}
          label="TOP STREAK"
        />
        <StatPill
          icon={<TrendingUp size={14} className="text-primary" />}
          value={`${weeklyAvg}%`}
          label="WEEKLY AVG"
        />
        <StatPill
          icon={<Trophy size={14} className="text-warning" />}
          value={`${bestStreak}d`}
          label="BEST STREAK"
        />
      </div>

      {/* Horizontal progress bar */}
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-foreground/70"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* Project / Tag filter chips */}
      <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onProjectFilter(null)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors",
            !activeProjectFilter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All ({taskCount})
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onProjectFilter(activeProjectFilter === p.id ? null : p.id)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors flex items-center gap-1.5",
              activeProjectFilter === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="w-full">
        <h2 className="text-[16px] font-bold tracking-tight">Today's Tasks</h2>
      </div>
    </div>
  );
};

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{value}</p>
        <p className="text-[9px] text-muted-foreground font-medium tracking-wider leading-tight">{label}</p>
      </div>
    </div>
  );
}

export default DailyProgressRing;
