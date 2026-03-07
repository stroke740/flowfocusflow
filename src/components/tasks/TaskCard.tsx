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
  onDragStart?: (task: Task) => void;
  completionCount?: number;
  dragHandleProps?: Record<string, any>;
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return { text: "Today", overdue: false };
  if (isTomorrow(date)) return { text: "Tomorrow", overdue: false };
  if (isPast(date)) return { text: "Overdue", overdue: true };
  return { text: format(date, "MMM d"), overdue: false };
}

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E"],
    disableForReducedMotion: true,
  });
}

const TaskCard = ({ task, onEdit, onDragStart, completionCount = 0, dragHandleProps }: TaskCardProps) => {
  const { completeTask, uncompleteTask, deleteTask } = useTaskMutations();
  const { toast } = useToast();
  const [completing, setCompleting] = useState(false);
  const [struck, setStruck] = useState(false);
  const isCompleted = task.status === "completed";
  const due = formatDueDate(task.due_date);
  const prio = PRIORITY_CONFIG[task.priority];
  const subtasksDone = task.subtasks?.filter((s) => s.status === "completed").length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const hasRecurrence = !!(task as any).recurrence_rule;

  const handleComplete = async () => {
    if (isCompleted) {
      await uncompleteTask.mutateAsync(task.id);
      return;
    }
    // Phase 1: Checkbox fill (150ms)
    setCompleting(true);
    // Phase 2: Strikethrough (starts at 150ms, 200ms duration)
    setTimeout(() => setStruck(true), 150);
    // Phase 3: Fade out + persist (starts at 350ms, 300ms duration → total 650ms)
    setTimeout(async () => {
      await completeTask.mutateAsync(task.id);
      setCompleting(false);
      setStruck(false);
      if ((completionCount + 1) % 5 === 0) {
        fireConfetti();
        toast({ title: "🎉 Milestone!", description: `You've completed ${completionCount + 1} tasks!` });
      }
    }, 650);
  };

  const handleDelete = async () => {
    deleteTask.mutate(task.id);
    toast({
      title: subtasksTotal > 0 ? `Deleted task and ${subtasksTotal} subtask(s)` : "Task deleted",
      description: "This action cannot be undone.",
    });
  };

  const handleSkipOccurrence = async () => {
    await completeTask.mutateAsync(task.id);
    toast({ title: "Occurrence skipped", description: "Next occurrence has been created." });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: struck ? 0.3 : isCompleted ? 0.5 : 1,
        y: struck ? -4 : 0,
        scale: struck ? 0.98 : 1,
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "group flex items-start gap-3 px-3.5 py-2.5 rounded-xl border border-border transition-shadow cursor-pointer",
        "hover:shadow-layered hover:-translate-y-px",
        task.priority !== "p4" && "border-l-[3px]",
        due?.overdue && !isCompleted && "bg-destructive/[0.03]",
        isCompleted && "opacity-50"
      )}
      style={{
        borderLeftColor: task.priority !== "p4" ? prio.color : undefined,
      }}
      onClick={() => onEdit(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
        className={cn(
          "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
          isCompleted || completing
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary/50 hover:scale-110"
        )}
        style={{ transition: "all 150ms ease" }}
      >
        {(isCompleted || completing) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, duration: 0.15 }}
          >
            <Check size={10} className="text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug line-clamp-2",
            (isCompleted || struck) && "line-through text-muted-foreground"
          )}
          style={{ transition: "all 200ms ease" }}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {due && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md",
              due.overdue && !isCompleted
                ? "bg-destructive/10 text-destructive font-medium"
                : "text-muted-foreground"
            )}>
              <Calendar size={10} />
              {due.text}
            </span>
          )}

          {hasRecurrence && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-primary/70">
              <Repeat size={10} />
            </span>
          )}

          {task.project && (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {task.project}
            </span>
          )}

          {task.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="text-[11px] px-1.5 py-0.5 rounded-md text-muted-foreground"
              style={{ backgroundColor: tag.color + "18" }}
            >
              {tag.name}
            </span>
          ))}
          {(task.tags?.length || 0) > 2 && (
            <span className="text-[11px] text-muted-foreground">+{(task.tags?.length || 0) - 2}</span>
          )}

          {subtasksTotal > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }} />
              </div>
              {subtasksDone}/{subtasksTotal}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="p-1 rounded-md hover:bg-muted">
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            {hasRecurrence && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSkipOccurrence(); }}>
                <SkipForward size={14} className="mr-2" /> Skip this occurrence
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default TaskCard;
