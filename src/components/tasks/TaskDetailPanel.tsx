import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Task, TaskPriority, PRIORITY_CONFIG } from "@/types/task";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AddTaskInput from "./AddTaskInput";
import RecurrencePicker, { RecurrenceRule, parseRecurrenceRule, serializeRecurrenceRule } from "./RecurrencePicker";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

const TaskDetailPanel = ({ task, onClose }: TaskDetailPanelProps) => {
  const { updateTask, deleteTask } = useTaskMutations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<TaskPriority>("p4");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority);
      setRecurrence(parseRecurrenceRule((task as any).recurrence_rule));
    }
  }, [task]);

  // Debounced auto-save
  useEffect(() => {
    if (!task) return;
    const timer = setTimeout(() => {
      updateTask.mutate({
        id: task.id,
        title,
        description: description || null,
        due_date: dueDate?.toISOString() || null,
        priority,
        recurrence_rule: serializeRecurrenceRule(recurrence),
      } as any);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, description, dueDate, priority, recurrence]);

  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-l border-border z-40 overflow-y-auto shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground">Edit Task</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="mb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-0 shadow-none px-0 h-auto focus-visible:ring-0"
              placeholder="Task title"
            />
          </div>

          <div className="mb-6">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, links, or details…"
              className="min-h-[100px] resize-none rounded-xl text-sm"
            />
          </div>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start h-10 rounded-xl text-sm", !dueDate && "text-muted-foreground")}>
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

          {/* Recurrence */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Recurrence</Label>
            <RecurrencePicker value={recurrence} onChange={setRecurrence} />
          </div>

          <div className="mb-6">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Priority</Label>
            <div className="flex gap-2">
              {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-xs font-medium transition-all border",
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

          <div className="mb-6">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Subtasks {task.subtasks?.length ? `(${task.subtasks.filter(s => s.status === 'completed').length}/${task.subtasks.length})` : ""}
            </Label>
            <div className="space-y-2 mb-2">
              {task.subtasks?.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 text-sm">
                  <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", sub.status === "completed" ? "bg-primary border-primary" : "border-border")}>
                    {sub.status === "completed" && <span className="text-[8px] text-primary-foreground">✓</span>}
                  </div>
                  <span className={cn(sub.status === "completed" && "line-through text-muted-foreground")}>{sub.title}</span>
                </div>
              ))}
            </div>
            <AddTaskInput parentId={task.id} />
          </div>

          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => { deleteTask.mutate(task.id); onClose(); }}
          >
            <Trash2 size={14} className="mr-2" />
            Delete Task
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskDetailPanel;
