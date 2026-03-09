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
  const radius = 44;
  const stroke = 6;
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

  const ringColor = pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))";
  const glowColor = pct === 100 ? "bg-success/10" : "bg-primary/8";

  return (
    <div className="flex flex-col items-center gap-5 py-3">
      {/* Progress Ring */}
      <div className="relative w-[108px] h-[108px]">
        {pct > 0 && (
          <motion.div
            className={cn("absolute inset-[-8px] rounded-full blur-xl", glowColor)}
            initial={{ opacity: 0 }}
            animate={{ opacity: pct === 100 ? 0.5 : 0.25 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        )}
        <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90 relative z-10">
          <circle
            cx="54" cy="54" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx="54" cy="54" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.span
            className={cn(
              "text-[24px] font-bold tracking-tight leading-none",
              pct === 100 ? "text-success" : "text-foreground"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {pct}%
          </motion.span>
          <span className={cn(
            "text-[11px] font-medium mt-1",
            pct === 100 ? "text-success/70" : "text-muted-foreground"
          )}>
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <StatPill
          icon={<Flame size={14} className="text-warning" />}
          value={`${streak}d`}
          label="STREAK"
          delay={0.1}
        />
        <StatPill
          icon={<TrendingUp size={14} className="text-success" />}
          value={weeklyAvg}
          label="AVG/DAY"
          delay={0.2}
        />
        <StatPill
          icon={<Trophy size={14} className="text-warning" />}
          value={`${bestStreak}d`}
          label="BEST"
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
      className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card px-3.5 py-3 shadow-soft"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight tabular-nums">{value}</p>
        <p className="text-[9px] text-muted-foreground font-semibold tracking-widest leading-tight mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export default DailyProgressRing;
