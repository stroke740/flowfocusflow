import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, isSameDay, eachDayOfInterval, isAfter } from "date-fns";
import { Trophy, CheckCircle2, TrendingUp, Calendar, X, Flame } from "lucide-react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";

interface WeeklyReviewProps {
  open: boolean;
  onClose: () => void;
  completedTasks: Task[];
  activeTasks: Task[];
}

const WeeklyReview = ({ open, onClose, completedTasks, activeTasks }: WeeklyReviewProps) => {
  const weekStart = subDays(new Date(), 6);

  const stats = useMemo(() => {
    const thisWeek = completedTasks.filter(
      (t) => t.completed_at && isAfter(new Date(t.completed_at), weekStart)
    );
    const prevWeek = completedTasks.filter(
      (t) => t.completed_at &&
        isAfter(new Date(t.completed_at), subDays(weekStart, 7)) &&
        !isAfter(new Date(t.completed_at), weekStart)
    );
    
    const days = eachDayOfInterval({ start: weekStart, end: new Date() });
    const dailyData = days.map((day) => ({
      label: format(day, "EEE"),
      count: thisWeek.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), day)).length,
    }));

    const bestDay = dailyData.reduce((a, b) => (b.count > a.count ? b : a), dailyData[0]);
    const streak = days.filter((day) =>
      thisWeek.some((t) => t.completed_at && isSameDay(new Date(t.completed_at), day))
    ).length;

    return {
      total: thisWeek.length,
      prevTotal: prevWeek.length,
      change: prevWeek.length > 0 ? Math.round(((thisWeek.length - prevWeek.length) / prevWeek.length) * 100) : 0,
      dailyData,
      bestDay,
      streak,
      byPriority: {
        p1: thisWeek.filter((t) => t.priority === "p1").length,
        p2: thisWeek.filter((t) => t.priority === "p2").length,
        p3: thisWeek.filter((t) => t.priority === "p3").length,
        p4: thisWeek.filter((t) => t.priority === "p4").length,
      },
    };
  }, [completedTasks, weekStart]);

  const maxDaily = Math.max(1, ...stats.dailyData.map((d) => d.count));

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Weekly Review</h2>
            <p className="text-[12px] text-muted-foreground">
              {format(weekStart, "MMM d")} – {format(new Date(), "MMM d")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", value: stats.total, label: "Completed" },
            { icon: Flame, color: "text-warning", bg: "bg-warning/10", value: `${stats.streak}d`, label: "Active Days" },
            { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", value: `${stats.change > 0 ? "+" : ""}${stats.change}%`, label: "vs Last Week" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-3 text-center"
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-4 mb-5"
        >
          <h3 className="text-[13px] font-semibold mb-3">Daily Breakdown</h3>
          <div className="flex items-end gap-2 h-24">
            {stats.dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-medium">{d.count}</span>
                <motion.div
                  className="w-full rounded-t-lg bg-primary/20"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxDaily) * 60}px` }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          {stats.bestDay && stats.bestDay.count > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Best day: <span className="text-foreground font-medium">{stats.bestDay.label}</span> with {stats.bestDay.count} tasks
            </p>
          )}
        </motion.div>

        {/* Pending tasks */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-4 mb-5"
        >
          <h3 className="text-[13px] font-semibold mb-1">Carrying Forward</h3>
          <p className="text-[11px] text-muted-foreground mb-3">{activeTasks.length} active tasks remaining</p>
          <div className="flex gap-2">
            {(["p1", "p2", "p3", "p4"] as const).map((p) => {
              const count = activeTasks.filter((t) => t.priority === p).length;
              return (
                <div key={p} className="flex-1 text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold">{count}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{p}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <Button onClick={onClose} className="w-full rounded-xl">
          <Trophy size={14} className="mr-2" /> Close Review
        </Button>
      </div>
    </motion.div>
  );
};

export default WeeklyReview;
