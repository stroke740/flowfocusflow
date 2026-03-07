import { useMemo } from "react";
import { format, subDays, isAfter, isSameDay, startOfDay, eachDayOfInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { Flame, Target, Trophy, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Task } from "@/types/task";

interface AnalyticsViewProps {
  activeTasks: Task[];
  completedTasks: Task[];
}

const AnalyticsView = ({ activeTasks, completedTasks }: AnalyticsViewProps) => {
  // Last 30 days of completions
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

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    let day = startOfDay(new Date());
    // Check if today has completions, if not start from yesterday
    const todayCompleted = completedTasks.some(
      (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
    );
    if (!todayCompleted) {
      day = subDays(day, 1);
    }

    while (true) {
      const hasCompletion = completedTasks.some(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
      );
      if (!hasCompletion) break;
      count++;
      day = subDays(day, 1);
    }
    return count;
  }, [completedTasks]);

  // This week stats
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

  // Average tasks per day (last 7 days)
  const avgPerDay = useMemo(() => {
    const last7 = completionData.slice(-7);
    const total = last7.reduce((sum, d) => sum + d.completed, 0);
    return (total / 7).toFixed(1);
  }, [completionData]);

  // Today's completions
  const todayCompleted = completedTasks.filter(
    (t) => t.completed_at && isSameDay(new Date(t.completed_at), new Date())
  ).length;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Flame}
          iconColor="text-warning"
          label="Current Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-success"
          label="Completed Today"
          value={String(todayCompleted)}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-primary"
          label="This Week"
          value={String(weekStats.thisWeek)}
          badge={weekStats.change !== 0 ? `${weekStats.change > 0 ? "+" : ""}${weekStats.change}%` : undefined}
          badgePositive={weekStats.change >= 0}
        />
        <StatCard
          icon={Target}
          iconColor="text-accent"
          label="Daily Average"
          value={avgPerDay}
        />
      </div>

      {/* Completion trend chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Completion Trend (30 days)</h3>
        <div className="h-48">
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
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Priority Breakdown (7 days)</h3>
        <div className="h-40">
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
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {priorityBreakdown.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remaining tasks summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Active Tasks</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{activeTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total active</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{activeTasks.filter((t) => t.priority === "p1").length}</p>
            <p className="text-xs text-muted-foreground">Urgent (P1)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  badge,
  badgePositive,
}: {
  icon: typeof Flame;
  iconColor: string;
  label: string;
  value: string;
  badge?: string;
  badgePositive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={iconColor} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold">{value}</span>
        {badge && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            badgePositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default AnalyticsView;
