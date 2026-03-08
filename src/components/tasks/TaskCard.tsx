import { useState } from "react";
import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { MoreHorizontal, Trash2, Pencil, Calendar, Check, Repeat, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, PRIORITY_CONFIG } from "@/types/task";
import { useTaskMutations } from "@/hooks/use-tasks";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  completionCount?: number;
}

const PRIORITY_RING: Record<string, string> = {
  p1: "border-destructive text-destructive hover:bg-destructive/8",
  p2: "border-warning text-warning hover:bg-warning/8",
  p3: "border-primary/40 text-primary/40 hover:bg-primary/5",
  p4: "border-muted-foreground/30 text-muted-foreground/30 hover:bg-muted-foreground/5",
};

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return { text: "Today", color: "text-primary font-semibold" };
  if (isTomorrow(date)) return { text: "Tomorrow", color: "text-accent-foreground" };
  if (isPast(date)) return { text: format(date, "MMM d"), color: "text-destructive font-semibold" };
  return { text: format(date, "MMM d"), color: "text-muted-foreground" };
}

function fireConfetti() {
  confetti({
    particleCount: 60,
    spread: 50,
    origin: { y: 0.7 },
    colors: ["#db4c3f", "#ff9933", "#4073ff", "#058527", "#808080"],
    disableForReducedMotion: true,
  });
}

const TaskCard = ({ task, onEdit, completionCount = 0 }: TaskCardProps) => {
  const { completeTask, uncompleteTask, deleteTask } = useTaskMutations();
  const { toast } = useToast();
  const [completing, setCompleting] = useState(false);
  const isCompleted = task.status === "completed";
  const due = formatDueDate(task.due_date);
  const subtasksDone = task.subtasks?.filter((s) => s.status === "completed").length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const hasRecurrence = !!(task as any).recurrence_rule;

  const handleComplete = async () => {
    if (isCompleted) {
      await uncompleteTask.mutateAsync(task.id);
      return;
    }
    setCompleting(true);
    setTimeout(async () => {
      await completeTask.mutateAsync(task.id);
      setCompleting(false);
      if ((completionCount + 1) % 5 === 0) {
        fireConfetti();
        toast({ title: "🎉 Nice streak!", description: `${completionCount + 1} tasks completed!` });
      }
    }, 400);
  };

  const handleDelete = async () => {
    deleteTask.mutate(task.id);
    toast({ title: "Task deleted" });
  };

  const handleSkipOccurrence = async () => {
    await completeTask.mutateAsync(task.id);
    toast({ title: "Occurrence skipped" });
  };

  // Progress for subtasks
  const subtaskPct = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: completing ? 0.4 : isCompleted ? 0.5 : 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-2xl border border-border bg-card cursor-pointer mb-2",
        "hover:shadow-task-hover transition-all duration-150",
        isCompleted && "opacity-60"
      )}
      onClick={() => onEdit(task)}
    >
      {/* Icon / Priority indicator */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          task.priority === "p1" ? "bg-destructive/10" :
          task.priority === "p2" ? "bg-warning/10" :
          task.priority === "p3" ? "bg-primary/10" :
          "bg-muted"
        )}
      >
        <span className="text-base">
          {PRIORITY_CONFIG[task.priority].emoji || "📋"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13.5px] leading-tight font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1">
          {hasRecurrence && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-warning font-semibold">
              <Repeat size={10} />
            </span>
          )}
          {due && (
            <span className={cn("text-[11px] font-semibold", due.color)}>
              {due.text}
            </span>
          )}
          {subtasksTotal > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {subtasksDone} total
            </span>
          )}
        </div>

        {/* Mini progress bar */}
        {subtasksTotal > 0 && (
          <div className="mt-1.5 h-[3px] w-12 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${subtaskPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color || "hsl(var(--primary))" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Circular checkbox on right */}
      <button
        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
        className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150",
          isCompleted || completing
            ? "bg-primary border-primary"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        {(isCompleted || completing) && (
          <Check size={14} className="text-primary-foreground" strokeWidth={3} />
        )}
      </button>

      {/* Context menu - hidden, shown on hover */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 absolute right-12 sm:relative sm:right-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Pencil size={13} className="mr-2" /> Edit
            </DropdownMenuItem>
            {hasRecurrence && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSkipOccurrence(); }}>
                <SkipForward size={13} className="mr-2" /> Skip
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
              <Trash2 size={13} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default TaskCard;
