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

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: completing ? 0.4 : isCompleted ? 0.5 : 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group flex items-start gap-3 px-2 py-3 task-separator cursor-pointer",
        "hover:bg-muted/50 -mx-2 rounded-xl transition-colors duration-100"
      )}
      onClick={() => onEdit(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
        className={cn(
          "w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 mt-[3px] transition-all duration-150",
          isCompleted || completing
            ? "bg-muted-foreground/40 border-muted-foreground/40"
            : PRIORITY_RING[task.priority]
        )}
      >
        {(isCompleted || completing) && (
          <Check size={10} className="text-background" strokeWidth={3} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13.5px] leading-[1.45] font-normal",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {task.description && !isCompleted && (
          <p className="text-[12px] text-muted-foreground/50 line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}

        {(due || hasRecurrence || task.project || (task.tags && task.tags.length > 0) || subtasksTotal > 0) && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {due && (
              <span className={cn("inline-flex items-center gap-1 text-[11px]", due.color)}>
                <Calendar size={10} />
                {due.text}
              </span>
            )}

            {hasRecurrence && (
              <span className="inline-flex items-center text-[11px] text-muted-foreground/50">
                <Repeat size={10} />
              </span>
            )}

            {task.project && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-[6px] h-[6px] rounded-[2px] bg-primary/40 flex-shrink-0" />
                {task.project}
              </span>
            )}

            {task.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded"
              >
                {tag.name}
              </span>
            ))}
            {(task.tags?.length || 0) > 2 && (
              <span className="text-[10px] text-muted-foreground/40">+{(task.tags?.length || 0) - 2}</span>
            )}

            {subtasksTotal > 0 && (
              <span className={cn(
                "text-[11px] tabular-nums",
                subtasksDone === subtasksTotal ? "text-success" : "text-muted-foreground"
              )}>
                {subtasksDone}/{subtasksTotal}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
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
