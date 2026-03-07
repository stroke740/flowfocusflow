import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface AddTaskInputProps {
  parentId?: string;
  /** If true, render as a controlled sheet (for mobile FAB) */
  asSheet?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

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
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      onDone?.();
    } else if (e.key >= "1" && e.key <= "4" && e.altKey) {
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
        placeholder="Task title… (try 'Buy groceries tomorrow p1')"
        className="border-0 shadow-none px-0 h-10 text-sm focus-visible:ring-0"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 text-xs gap-1.5 rounded-lg", dueDate && "text-primary")}>
              <CalendarIcon size={14} />
              {dueDate ? format(dueDate, "MMM d") : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-0.5">
          {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                "w-7 h-7 rounded-lg text-xs font-medium transition-colors flex items-center justify-center",
                priority === p ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
              title={`Priority ${p.toUpperCase()} (Alt+${p[1]})`}
            >
              {PRIORITY_CONFIG[p].emoji || p.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button size="sm" className="h-8 text-xs rounded-lg" onClick={handleSubmit} disabled={!title.trim() || addTask.isPending}>
          Add Task
        </Button>
      </div>
    </div>
  );
};

const AddTaskInput = ({ parentId, asSheet, sheetOpen, onSheetOpenChange }: AddTaskInputProps) => {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Global Q shortcut
  useEffect(() => {
    if (parentId) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "q" && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setExpanded(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [parentId]);

  // Sheet mode for mobile FAB
  if (asSheet) {
    return (
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader>
            <SheetTitle className="text-left">New Task</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AddTaskForm parentId={parentId} onDone={() => onSheetOpenChange?.(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Inline form for subtasks
  if (parentId) {
    return (
      <div className="border border-border rounded-xl p-3 bg-card shadow-sm">
        <AddTaskForm parentId={parentId} onDone={() => {}} />
      </div>
    );
  }

  // Default: show sheet trigger (handled by parent via asSheet prop)
  return (
    <button
      onClick={() => setExpanded(true)}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border border-dashed border-border transition-colors"
    >
      <Plus size={16} />
      Add a task…
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="border border-border rounded-xl p-3 bg-card shadow-sm"
      >
        <AddTaskForm parentId={parentId} onDone={() => { setExpanded(false); }} />
        {!parentId && (
          <div className="flex justify-end mt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AddTaskInput;
