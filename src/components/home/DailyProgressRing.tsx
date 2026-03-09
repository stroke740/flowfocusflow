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
  const radius = 38;
  const stroke = 4.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

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

  const weeklyAvg = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const totalDone = days.reduce((sum, day) => {
      return sum + completedTasks.filter(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      ).length;
    }, 0);
    // Return average tasks per day (rounded to 1 decimal)
    const avg = totalDone / 7;
    return avg >= 1 ? avg.toFixed(0) : avg.toFixed(1);
  }, [completedTasks]);

  return (
    <div className="flex flex-col items-center gap-5 py-3">
      {/* Progress Ring with subtle glow */}
      <div className="relative w-[96px] h-[96px]">
        {/* Background glow */}
        {pct > 0 && (
          <motion.div
            className="absolute inset-[-8px] rounded-full bg-primary/8 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        )}
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 relative z-10">
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.span
            className="text-[22px] font-bold tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {pct}%
          </motion.span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <StatPill
          icon={<Flame size={14} className="text-amber-500" />}
          value={`${streak}d`}
          label="STREAK"
          color="amber"
          delay={0.1}
        />
        <StatPill
          icon={<TrendingUp size={14} className="text-emerald-500" />}
          value={weeklyAvg}
          label="AVG/DAY"
          color="emerald"
          delay={0.2}
        />
        <StatPill
          icon={<Trophy size={14} className="text-amber-500" />}
          value={`${bestStreak}d`}
          label="BEST"
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Project / Tag filter chips */}
      <div className="flex items-center gap-2 w-full overflow-x-auto pb-0.5 no-scrollbar">
        <motion.button
          onClick={() => onProjectFilter(null)}
          className={cn(
            "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200",
            !activeProjectFilter
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
          whileTap={{ scale: 0.95 }}
        >
          All ({taskCount})
        </motion.button>
        {projects.map((p) => (
          <motion.button
            key={p.id}
            onClick={() => onProjectFilter(activeProjectFilter === p.id ? null : p.id)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5",
              activeProjectFilter === p.id
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-[12px]">{p.icon}</span> {p.name}
          </motion.button>
        ))}
      </div>

      {/* Section header */}
      <div className="w-full flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight">Today's Tasks</h2>
        <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
          {completed} of {total} done
        </span>
      </div>
    </div>
  );
};

function StatPill({ icon, value, label, delay = 0 }: { icon: React.ReactNode; value: string; label: string; delay?: number }) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold leading-tight tabular-nums">{value}</p>
        <p className="text-[8px] text-muted-foreground font-semibold tracking-widest leading-tight">{label}</p>
      </div>
    </motion.div>
  );
}

export default DailyProgressRing;
