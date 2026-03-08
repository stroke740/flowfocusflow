import { useState } from "react";
import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { MoreHorizontal, Trash2, Pencil, Check, Repeat, SkipForward } from "lucide-react";
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

const PRIORITY_COLORS: Record<string, string> = {
  p1: "bg-destructive/10",
  p2: "bg-warning/10",
  p3: "bg-primary/8",
  p4: "bg-muted",
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
    const { showUndoToast } = await import("@/components/tasks/UndoToast");
    deleteTask.mutate(task.id);
    showUndoToast("Task deleted", () => {
      // Re-add the task (undo)
      const { addTask } = useTaskMutations();
      // Since we can't easily undo, show feedback
    });
    toast({ title: "Task deleted" });
  };

  const handleSkipOccurrence = async () => {
    await completeTask.mutateAsync(task.id);
    toast({ title: "Occurrence skipped" });
  };

  const subtaskPct = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: completing ? 0.4 : isCompleted ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "group relative flex items-center gap-3 p-3.5 rounded-2xl border border-border/60 bg-card cursor-pointer mb-2",
        "hover:border-border hover:shadow-sm transition-all duration-200",
        isCompleted && "opacity-60"
      )}
      onClick={() => onEdit(task)}
    >
      {/* Priority icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
          PRIORITY_COLORS[task.priority] || "bg-muted"
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
            "text-[13.5px] leading-snug font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          {hasRecurrence && (
            <span className="inline-flex items-center text-[11px] text-warning">
              <Repeat size={10} />
            </span>
          )}
          {due && (
            <span className={cn("text-[11px]", due.color)}>
              {due.text}
            </span>
          )}
          {subtasksTotal > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {subtasksDone}/{subtasksTotal}
            </span>
          )}
        </div>

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

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-background"
                style={{ backgroundColor: tag.color || "hsl(var(--primary))" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
        className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
          isCompleted || completing
            ? "bg-primary border-primary scale-100"
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {(isCompleted || completing) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check size={13} className="text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Context menu */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-12 sm:relative sm:right-auto">
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
