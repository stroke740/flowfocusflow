import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, Calendar as CalendarIcon, Flag } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTaskMutations } from "@/hooks/use-tasks";
import { parseNaturalLanguageTask } from "@/lib/parse-task";
import { TaskPriority, PRIORITY_CONFIG } from "@/types/task";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddTaskInputProps {
  parentId?: string;
  asSheet?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  p1: "text-destructive",
  p2: "text-warning",
  p3: "text-primary",
  p4: "text-muted-foreground",
};

const AddTaskForm = ({ parentId, onDone }: { parentId?: string; onDone?: () => void }) => {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<TaskPriority>("p4");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskMutations();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const parsed = parseNaturalLanguageTask(title);
    await addTask.mutateAsync({
      title: parsed.title,
      due_date: (parsed.dueDate || dueDate)?.toISOString() || null,
      priority: parsed.priority !== "p4" ? parsed.priority : priority,
      parent_id: parentId || null,
    });
    setTitle("");
    setDueDate(undefined);
    setPriority("p4");
    if (onDone) onDone();
    else inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    else if (e.key === "Escape") { setTitle(""); onDone?.(); }
    else if (e.key >= "1" && e.key <= "4" && e.altKey) {
      e.preventDefault();
      setPriority(`p${e.key}` as TaskPriority);
    }
  };

  return (
    <div className="space-y-3">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task name"
        className="border-0 shadow-none px-0 h-10 text-[14px] focus-visible:ring-0 placeholder:text-muted-foreground/40"
        autoFocus
      />
      {title.trim() && (
        <p className="text-[11px] text-muted-foreground/50 -mt-1">
          Try: "Buy groceries tomorrow p1"
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-[11px] gap-1 rounded-md border-border", dueDate && "text-primary border-primary/30")}>
              <CalendarIcon size={12} />
              {dueDate ? format(dueDate, "MMM d") : "Due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-[11px] gap-1 rounded-md border-border", priority !== "p4" && PRIORITY_COLORS[priority])}>
              <Flag size={12} />
              {priority !== "p4" ? `P${priority[1]}` : "Priority"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="start">
            {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-colors",
                  priority === p ? "bg-muted font-medium" : "hover:bg-muted/60"
                )}
              >
                <Flag size={12} className={PRIORITY_COLORS[p]} />
                Priority {p[1]}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        <Button
          size="sm"
          className="h-7 text-[11px] rounded-md px-4"
          onClick={handleSubmit}
          disabled={!title.trim() || addTask.isPending}
        >
          Add task
        </Button>
      </div>
    </div>
  );
};

const AddTaskInput = ({ parentId, asSheet, sheetOpen, onSheetOpenChange }: AddTaskInputProps) => {
  const [expanded, setExpanded] = useState(false);

  if (asSheet) {
    return (
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader>
            <SheetTitle className="text-left text-sm font-semibold">New task</SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            <AddTaskForm parentId={parentId} onDone={() => onSheetOpenChange?.(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (parentId) {
    return (
      <div className="border border-border rounded-lg p-3 bg-card">
        <AddTaskForm parentId={parentId} onDone={() => {}} />
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="w-full flex items-center gap-2 px-1 py-2 text-[13px] text-muted-foreground/50 hover:text-primary transition-colors"
    >
      <Plus size={14} className="text-primary" />
      Add task
    </button>
  );
};

export default AddTaskInput;
