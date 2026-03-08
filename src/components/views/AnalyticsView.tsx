import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, isAfter, isSameDay, startOfDay, eachDayOfInterval, getDay, subWeeks, startOfWeek } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar,
} from "recharts";
import { Flame, Target, Trophy, TrendingUp, CheckCircle2, Zap, Calendar } from "lucide-react";
import { Task } from "@/types/task";

interface AnalyticsViewProps {
  activeTasks: Task[];
  completedTasks: Task[];
}

const AnalyticsView = ({ activeTasks, completedTasks }: AnalyticsViewProps) => {
  const completionData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((day) => ({
      date: format(day, "MMM d"),
      shortDate: format(day, "d"),
      completed: completedTasks.filter((t) =>
        t.completed_at && isSameDay(new Date(t.completed_at), day)
      ).length,
    }));
  }, [completedTasks]);

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
    const days = eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() });
    let best = 0, current = 0;
    for (const day of days) {
      const has = completedTasks.some(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      );
      if (has) { current++; best = Math.max(best, current); }
      else current = 0;
    }
    return best;
  }, [completedTasks]);

  // Week stats
  const weekStats = useMemo(() => {
    const weekStart = subDays(new Date(), 6);
    const thisWeek = completedTasks.filter(
      (t) => t.completed_at && isAfter(new Date(t.completed_at), weekStart)
    );
    const prevWeekStart = subDays(weekStart, 7);
    const prevWeek = completedTasks.filter(
      (t) => t.completed_at &&
        isAfter(new Date(t.completed_at), prevWeekStart) &&
        !isAfter(new Date(t.completed_at), weekStart)
    );
    return {
      thisWeek: thisWeek.length,
      prevWeek: prevWeek.length,
      change: prevWeek.length > 0 ? Math.round(((thisWeek.length - prevWeek.length) / prevWeek.length) * 100) : 0,
    };
  }, [completedTasks]);

  // Weekly average
  const avgPerDay = useMemo(() => {
    const last7 = completionData.slice(-7);
    const total = last7.reduce((sum, d) => sum + d.completed, 0);
    return (total / 7).toFixed(1);
  }, [completionData]);

  const todayCompleted = completedTasks.filter(
    (t) => t.completed_at && isSameDay(new Date(t.completed_at), new Date())
  ).length;

  // 7-week activity heatmap
  const heatmapData = useMemo(() => {
    const weeks: { day: number; week: number; count: number; date: string }[] = [];
    for (let w = 6; w >= 0; w--) {
      const weekStart2 = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 });
      for (let d = 0; d < 7; d++) {
        const day = subDays(weekStart2, -d);
        const count = completedTasks.filter(
          (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
        ).length;
        weeks.push({ day: d, week: 6 - w, count, date: format(day, "MMM d") });
      }
    }
    return weeks;
  }, [completedTasks]);

  const maxHeatmap = Math.max(1, ...heatmapData.map((d) => d.count));

  // Priority breakdown
  const priorityBreakdown = useMemo(() => {
    const last7 = completedTasks.filter(
      (t) => t.completed_at && isAfter(new Date(t.completed_at), subDays(new Date(), 7))
    );
    return [
      { name: "P1 Urgent", count: last7.filter((t) => t.priority === "p1").length, fill: "hsl(var(--destructive))" },
      { name: "P2 High", count: last7.filter((t) => t.priority === "p2").length, fill: "hsl(var(--warning))" },
      { name: "P3 Medium", count: last7.filter((t) => t.priority === "p3").length, fill: "hsl(38, 92%, 50%)" },
      { name: "P4 Low", count: last7.filter((t) => t.priority === "p4").length, fill: "hsl(var(--muted-foreground))" },
    ];
  }, [completedTasks]);

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Flame, color: "text-warning", bg: "bg-warning/10", label: "Current Streak", value: `${streak}d`, sub: streak > 0 ? "🔥 Keep it up!" : "Start today" },
          { icon: Trophy, color: "text-primary", bg: "bg-primary/10", label: "Best Streak", value: `${bestStreak}d`, sub: streak >= bestStreak && streak > 0 ? "New record!" : "" },
          { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Today", value: String(todayCompleted), sub: todayCompleted >= 5 ? "On fire!" : "" },
          { icon: TrendingUp, color: "text-accent-foreground", bg: "bg-accent/50", label: "This Week", value: String(weekStats.thisWeek), sub: weekStats.change !== 0 ? `${weekStats.change > 0 ? "+" : ""}${weekStats.change}%` : "Same" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            {stat.sub && (
              <p className="text-[10px] text-primary font-medium mt-1">{stat.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Activity heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Activity (7 weeks)</h3>
        </div>
        <div className="flex gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((d, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-[8px] text-muted-foreground/60 font-medium">
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>
          {/* Heatmap grid */}
          {Array.from({ length: 7 }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1 flex-1">
              {Array.from({ length: 7 }).map((_, d) => {
                const cell = heatmapData.find((h) => h.week === w && h.day === d);
                const intensity = cell ? cell.count / maxHeatmap : 0;
                return (
                  <div
                    key={d}
                    title={cell ? `${cell.date}: ${cell.count} tasks` : ""}
                    className="w-full aspect-square rounded-[4px] transition-colors"
                    style={{
                      backgroundColor: intensity === 0
                        ? "hsl(var(--muted))"
                        : `hsl(var(--primary) / ${0.15 + intensity * 0.75})`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[9px] text-muted-foreground mr-1">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <div
              key={v}
              className="w-3 h-3 rounded-[3px]"
              style={{
                backgroundColor: v === 0
                  ? "hsl(var(--muted))"
                  : `hsl(var(--primary) / ${0.15 + v * 0.75})`,
              }}
            />
          ))}
          <span className="text-[9px] text-muted-foreground ml-1">More</span>
        </div>
      </motion.div>

      {/* Completion trend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">30-Day Trend</h3>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            avg {avgPerDay}/day
          </span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.12)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Priority breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold mb-4">Priority Breakdown (7 days)</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityBreakdown} layout="vertical">
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                {priorityBreakdown.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Active tasks summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold mb-3">Active Tasks</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{activeTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{activeTasks.filter((t) => t.priority === "p1").length}</p>
            <p className="text-[10px] text-muted-foreground">Urgent</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{completedTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">All time</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsView;
