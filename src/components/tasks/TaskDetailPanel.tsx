import { useState, useEffect, useMemo } from "react";
import { format, subDays, isSameDay, startOfDay, eachDayOfInterval, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ArrowLeft, Pencil, Calendar as CalendarIcon, Trash2, X, Repeat, Tag as TagIcon, FolderOpen, Flame, Trophy, Hash, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, TaskPriority, PRIORITY_CONFIG, Tag } from "@/types/task";
import { Project } from "@/hooks/use-projects";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import AddTaskInput from "./AddTaskInput";
import AttachmentList from "./AttachmentList";
import RecurrencePicker, { RecurrenceRule, parseRecurrenceRule, serializeRecurrenceRule } from "./RecurrencePicker";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  projects?: Project[];
  tags?: Tag[];
}

const TaskDetailPanel = ({ task, onClose, projects = [], tags: availableTags = [] }: TaskDetailPanelProps) => {
  const { updateTask, deleteTask, setTaskTags, addTag } = useTaskMutations();
  const { data: completedTasks = [] } = useTasks("completed");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<TaskPriority>("p4");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority);
      setProjectId(task.project_id || null);
      setRecurrence(parseRecurrenceRule((task as any).recurrence_rule));
      setEditMode(false);
    }
  }, [task]);

  // Debounced auto-save
  useEffect(() => {
    if (!task || !editMode) return;
    const timer = setTimeout(() => {
      updateTask.mutate({
        id: task.id,
        title,
        description: description || null,
        due_date: dueDate?.toISOString() || null,
        priority,
        project_id: projectId,
        recurrence_rule: serializeRecurrenceRule(recurrence),
      } as any);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, description, dueDate, priority, projectId, recurrence]);

  const handleAddTag = async () => {
    if (!task || !tagInput.trim()) return;
    const result = await addTag.mutateAsync({ name: tagInput.trim() });
    const currentTagIds = task.tags?.map((t) => t.id) || [];
    if (!currentTagIds.includes(result.id)) {
      await setTaskTags.mutateAsync({ taskId: task.id, tagIds: [...currentTagIds, result.id] });
    }
    setTagInput("");
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!task) return;
    const newIds = (task.tags || []).filter((t) => t.id !== tagId).map((t) => t.id);
    await setTaskTags.mutateAsync({ taskId: task.id, tagIds: newIds });
  };

  // Task-specific completion stats
  const taskCompletions = useMemo(() => {
    if (!task) return [];
    return completedTasks.filter((t) => t.title === task.title);
  }, [task, completedTasks]);

  const totalCompletions = taskCompletions.length + (task?.status === "completed" ? 1 : 0);

  // Current streak for this task
  const currentStreak = useMemo(() => {
    if (!task) return 0;
    let count = 0;
    let day = startOfDay(new Date());
    const allCompletions = [...taskCompletions];
    if (task.status === "completed" && task.completed_at) {
      allCompletions.push(task as any);
    }
    const todayDone = allCompletions.some(
      (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
    );
    if (!todayDone) day = subDays(day, 1);
    while (true) {
      const has = allCompletions.some(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at!), day)
      );
      if (!has) break;
      count++;
      day = subDays(day, 1);
    }
    return count;
  }, [task, taskCompletions]);

  // Best streak
  const bestStreak = useMemo(() => {
    const allCompletions = [...taskCompletions];
    if (task?.status === "completed" && task.completed_at) {
      allCompletions.push(task as any);
    }
    if (allCompletions.length === 0) return 0;
    const days = new Set(
      allCompletions
        .filter((t) => t.completed_at)
        .map((t) => format(new Date(t.completed_at!), "yyyy-MM-dd"))
    );
    const sorted = Array.from(days).sort();
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
      if (diff === 1) { cur++; } else { cur = 1; }
      max = Math.max(max, cur);
    }
    return max;
  }, [task, taskCompletions]);

  // 30-day completion data
  const thirtyDayData = useMemo(() => {
    if (!task) return { completed: 0, total: 30, pct: 0 };
    const allCompletions = [...taskCompletions];
    if (task.status === "completed" && task.completed_at) {
      allCompletions.push(task as any);
    }
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const completed = days.filter((day) =>
      allCompletions.some((t) => t.completed_at && isSameDay(new Date(t.completed_at!), day))
    ).length;
    return { completed, total: 30, pct: Math.round((completed / 30) * 100) };
  }, [task, taskCompletions]);

  // Activity heatmap (last 7 weeks)
  const heatmapData = useMemo(() => {
    if (!task) return [];
    const allCompletions = [...taskCompletions];
    if (task.status === "completed" && task.completed_at) {
      allCompletions.push(task as any);
    }
    const days = eachDayOfInterval({ start: subDays(new Date(), 48), end: new Date() });
    return days.map((day) => ({
      date: day,
      count: allCompletions.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at!), day)).length,
    }));
  }, [task, taskCompletions]);

  // Monthly completions (last 6 months)
  const monthlyData = useMemo(() => {
    if (!task) return [];
    const allCompletions = [...taskCompletions];
    if (task.status === "completed" && task.completed_at) {
      allCompletions.push(task as any);
    }
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const count = allCompletions.filter((t) => {
        if (!t.completed_at) return false;
        const d = new Date(t.completed_at);
        return d >= start && d <= end;
      }).length;
      return { month: format(month, "MMM"), count };
    });
  }, [task, taskCompletions]);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  if (!task) return null;

  const selectedProject = projects.find((p) => p.id === projectId);
  const hasRecurrence = !!(task as any).recurrence_rule;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-border flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">
            {PRIORITY_CONFIG[task.priority].emoji || "📋"}
          </span>
          <h2 className="text-[15px] font-bold truncate">{task.title}</h2>
        </div>
        <button onClick={() => setEditMode(!editMode)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Pencil size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Tag chips row */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProject && (
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              <FolderOpen size={12} /> {selectedProject.name}
            </span>
          )}
          {hasRecurrence && (
            <span className="inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              <Repeat size={12} /> Recurring
            </span>
          )}
          {task.tags?.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || "hsl(var(--primary))" }} />
              {tag.name}
            </span>
          ))}
          {dueDate && (
            <span className="inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              <CalendarIcon size={12} /> {format(dueDate, "MMM d")}
            </span>
          )}
        </div>

        {/* Streak stat cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={12} className="text-warning" />
              <span className="text-[10px] text-muted-foreground font-medium">Current</span>
            </div>
            <p className="text-xl font-bold">{currentStreak}d</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={12} className="text-warning" />
              <span className="text-[10px] text-muted-foreground font-medium">Best</span>
            </div>
            <p className="text-xl font-bold">{bestStreak}d</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Hash size={12} className="text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Total</span>
            </div>
            <p className="text-xl font-bold">{totalCompletions}</p>
          </div>
        </div>

        {/* 30-day completion bar */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] text-muted-foreground font-medium mb-2">30-day completion</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${thirtyDayData.pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[12px] text-muted-foreground font-semibold">{thirtyDayData.pct}%</span>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-3">Activity Heatmap</h3>
          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "w-full aspect-square rounded-sm transition-colors",
                  day.count === 0 ? "bg-muted" :
                  day.count === 1 ? "bg-primary/30" :
                  day.count === 2 ? "bg-primary/60" :
                  "bg-primary"
                )}
                title={`${format(day.date, "MMM d")}: ${day.count}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>

        {/* Monthly Completions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-3">Monthly Completions</h3>
          <div className="flex items-end gap-2 h-20">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-t bg-primary/20"
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.count / maxMonthly) * 60}px` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit section — collapsible */}
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-border pt-4"
          >
            {/* Title */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm rounded-lg"
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, links, or details…"
                className="min-h-[80px] resize-none rounded-lg text-sm"
              />
            </div>

            {/* Due Date */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start h-9 rounded-lg text-sm", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon size={14} className="mr-2" />
                    {dueDate ? format(dueDate, "PPP") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <button onClick={() => setDueDate(undefined)} className="text-xs text-muted-foreground hover:text-foreground mt-1">
                  Clear date
                </button>
              )}
            </div>

            {/* Priority */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Priority</Label>
              <div className="flex gap-1.5">
                {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-xs font-medium transition-all border",
                      priority === p
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Project</Label>
              <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="No project">
                    {selectedProject ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedProject.color }} />
                        {selectedProject.name}
                      </span>
                    ) : (
                      "No project"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tags</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {task.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag.name}
                    <button onClick={() => handleRemoveTag(tag.id)} className="hover:text-foreground">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag…"
                className="h-8 text-xs rounded-lg"
              />
            </div>

            {/* Subtasks */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Subtasks {task.subtasks && task.subtasks.length > 0 && `(${task.subtasks.filter((s) => s.status === "completed").length}/${task.subtasks.length})`}
              </Label>
              <div className="space-y-1.5 mb-2">
                {task.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      sub.status === "completed" ? "bg-primary border-primary" : "border-border"
                    )}>
                      {sub.status === "completed" && <span className="text-[8px] text-primary-foreground">✓</span>}
                    </div>
                    <span className={cn("text-sm", sub.status === "completed" && "line-through text-muted-foreground")}>{sub.title}</span>
                  </div>
                ))}
              </div>
              <AddTaskInput parentId={task.id} />
            </div>

            {/* Recurrence */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Recurrence</Label>
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />
            </div>
          </motion.div>
        )}

        {/* Attachments */}
        <div className="border-t border-border pt-4">
          <AttachmentList taskId={task.id} />
        </div>

        {/* Meta */}
        <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
          Created {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}
        </div>

        {/* Archive & Delete */}
        <div className="space-y-2 pb-4">
          <Button
            variant="outline"
            className="w-full rounded-xl h-11 text-sm font-medium"
            onClick={() => {
              updateTask.mutate({ id: task.id, status: "archived" } as any);
              onClose();
            }}
          >
            <Archive size={14} className="mr-2" />
            Archive Task
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-xl h-11 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { deleteTask.mutate(task.id); onClose(); }}
          >
            <Trash2 size={14} className="mr-2" />
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPanel;
