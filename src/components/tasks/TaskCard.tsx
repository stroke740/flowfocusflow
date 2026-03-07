import { useState } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { GripVertical, MoreHorizontal, Trash2, Pencil, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, PRIORITY_CONFIG } from "@/types/task";
import { useTaskMutations } from "@/hooks/use-tasks";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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

const TaskCard = ({ task, onEdit, onDragStart, completionCount = 0, dragHandleProps }: TaskCardProps) => {
  const { completeTask, uncompleteTask, deleteTask } = useTaskMutations();
  const { toast } = useToast();
  const [completing, setCompleting] = useState(false);
  const isCompleted = task.status === "completed";
  const due = formatDueDate(task.due_date);
  const prio = PRIORITY_CONFIG[task.priority];
  const subtasksDone = task.subtasks?.filter((s) => s.status === "completed").length || 0;
  const subtasksTotal = task.subtasks?.length || 0;

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
        toast({ title: "🎉 Milestone!", description: `You've completed ${completionCount + 1} tasks!` });
      }
    }, 600);
  };

  const handleDelete = async () => {
    deleteTask.mutate(task.id);
    toast({
      title: subtasksTotal > 0 ? `Deleted task and ${subtasksTotal} subtask(s)` : "Task deleted",
      description: "This action cannot be undone.",
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: completing ? 0.3 : isCompleted ? 0.5 : 1,
        y: completing ? -6 : 0,
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group flex items-start gap-3 px-3.5 py-2.5 rounded-xl border border-border transition-all cursor-pointer",
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
      {/* Drag handle */}
      <div
        className="opacity-0 group-hover:opacity-30 transition-opacity mt-0.5 cursor-grab touch-none"
        {...dragHandleProps}
      >
        <GripVertical size={14} />
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
        className={cn(
          "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150",
          isCompleted || completing
            ? "bg-primary border-primary scale-100"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        {(isCompleted || completing) && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
            <Check size={10} className="text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium leading-snug line-clamp-2",
          (isCompleted || completing) && "line-through text-muted-foreground"
        )}>
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

          {task.project && (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {task.project}
            </span>
          )}

          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag.id} className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground">
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
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
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
