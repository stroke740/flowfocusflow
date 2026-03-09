import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, isAfter, isSameDay, startOfDay, eachDayOfInterval, subWeeks, startOfWeek, differenceInDays } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Flame, Target, Trophy, TrendingUp, CheckCircle2, Zap, Calendar, Clock, BarChart3, PieChart as PieIcon, Activity } from "lucide-react";
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

  // Completion rate (last 7 days)
  const completionRate = useMemo(() => {
    const totalCreatedLast7 = [...activeTasks, ...completedTasks].filter(
      (t) => isAfter(new Date(t.created_at), subDays(new Date(), 7))
    ).length;
    const completedLast7 = completedTasks.filter(
      (t) => t.completed_at && isAfter(new Date(t.completed_at), subDays(new Date(), 7))
    ).length;
    return totalCreatedLast7 > 0 ? Math.round((completedLast7 / totalCreatedLast7) * 100) : 0;
  }, [activeTasks, completedTasks]);

  // Average completion time (days)
  const avgCompletionTime = useMemo(() => {
    const withBoth = completedTasks.filter((t) => t.completed_at && t.created_at);
    if (withBoth.length === 0) return "–";
    const totalDays = withBoth.reduce((sum, t) => {
      return sum + differenceInDays(new Date(t.completed_at!), new Date(t.created_at));
    }, 0);
    const avg = totalDays / withBoth.length;
    return avg < 1 ? "<1d" : `${avg.toFixed(1)}d`;
  }, [completedTasks]);

  // Overdue tasks
  const overdueCount = useMemo(() => {
    return activeTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date()
    ).length;
  }, [activeTasks]);

  // Weekly completion comparison (last 4 weeks)
  const weeklyComparison = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => {
      const weekEnd = subWeeks(new Date(), i);
      const weekStart = subDays(weekEnd, 6);
      const count = completedTasks.filter(
        (t) => t.completed_at &&
          isAfter(new Date(t.completed_at), weekStart) &&
          !isAfter(new Date(t.completed_at), weekEnd)
      ).length;
      return {
        week: i === 0 ? "This wk" : i === 1 ? "Last wk" : `${i}wk ago`,
        completed: count,
      };
    }).reverse();
  }, [completedTasks]);

  // Task status pie
  const statusPie = useMemo(() => {
    const active = activeTasks.length;
    const completed = completedTasks.length;
    return [
      { name: "Active", value: active, fill: "hsl(var(--primary))" },
      { name: "Completed", value: completed, fill: "hsl(var(--success))" },
    ].filter((d) => d.value > 0);
  }, [activeTasks, completedTasks]);

  // Day-of-week productivity
  const dayOfWeekData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    completedTasks.forEach((t) => {
      if (t.completed_at) {
        const day = new Date(t.completed_at).getDay();
        counts[day]++;
      }
    });
    return dayNames.map((name, i) => ({ day: name, tasks: counts[i] }));
  }, [completedTasks]);

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const cardClass = "rounded-2xl border border-border bg-card p-5";

  return (
    <div className="space-y-5">
      {/* Stat cards - row 1 */}
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

      {/* Stat cards - row 2 (new) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, color: "text-success", bg: "bg-success/10", label: "Completion Rate", value: `${completionRate}%` },
          { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Avg Time", value: avgCompletionTime },
          { icon: Zap, color: "text-destructive", bg: "bg-destructive/10", label: "Overdue", value: String(overdueCount) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.06, duration: 0.35 }}
            className="rounded-2xl border border-border bg-card p-3.5 text-center"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cardClass}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Activity (7 weeks)</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((d, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-[8px] text-muted-foreground/60 font-medium">
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>
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

      {/* Task status pie + Day of week side by side */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={cardClass}
        >
          <div className="flex items-center gap-2 mb-3">
            <PieIcon size={14} className="text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Status</h3>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={42}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-1">
            {statusPie.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                <span className="text-[10px] text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className={cardClass}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">By Day</h3>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Completion trend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cardClass}
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

      {/* Weekly comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={cardClass}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Weekly Comparison</h3>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
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
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Priority breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cardClass}
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
        transition={{ delay: 0.55 }}
        className={cardClass}
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
