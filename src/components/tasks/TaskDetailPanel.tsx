import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Calendar as CalendarIcon, Trash2, Clock, Repeat, Tag as TagIcon, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, TaskPriority, PRIORITY_CONFIG, Tag } from "@/types/task";
import { Project } from "@/hooks/use-projects";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddTaskInput from "./AddTaskInput";
import RecurrencePicker, { RecurrenceRule, parseRecurrenceRule, serializeRecurrenceRule } from "./RecurrencePicker";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  projects?: Project[];
  tags?: Tag[];
}

const TaskDetailPanel = ({ task, onClose, projects = [], tags: availableTags = [] }: TaskDetailPanelProps) => {
  const { updateTask, deleteTask, setTaskTags, addTag } = useTaskMutations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<TaskPriority>("p4");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority);
      setProjectId(task.project_id || null);
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

  if (!task) return null;

  const subtasksDone = task.subtasks?.filter((s) => s.status === "completed").length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-border flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task Details</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold border-0 shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
          placeholder="Task title"
        />

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
            Subtasks {subtasksTotal > 0 && `(${subtasksDone}/${subtasksTotal})`}
          </Label>
          {subtasksTotal > 0 && (
            <div className="w-full h-1.5 rounded-full bg-muted mb-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }}
              />
            </div>
          )}
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

        {/* Meta */}
        <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
          Created {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}
        </div>

        {/* Delete */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
          onClick={() => { deleteTask.mutate(task.id); onClose(); }}
        >
          <Trash2 size={14} className="mr-2" />
          Delete Task
        </Button>
      </div>
    </div>
  );
};

export default TaskDetailPanel;
