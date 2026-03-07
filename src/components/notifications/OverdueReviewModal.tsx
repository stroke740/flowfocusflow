import { useState, useMemo } from "react";
import { isBefore, startOfDay, format } from "date-fns";
import { AlertTriangle, CalendarClock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask: (task: Task) => void;
}

const OverdueReviewModal = ({ tasks, open, onOpenChange, onEditTask }: Props) => {
  const { updateTask } = useTaskMutations();
  const [rescheduleAll, setRescheduleAll] = useState(false);

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === "active" &&
          t.due_date &&
          isBefore(new Date(t.due_date), startOfDay(new Date()))
      ),
    [tasks]
  );

  const handleMoveAllToToday = async () => {
    const today = new Date().toISOString();
    for (const t of overdueTasks) {
      await updateTask.mutateAsync({ id: t.id, due_date: today });
    }
    onOpenChange(false);
  };

  const handleRescheduleOne = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, due_date: new Date().toISOString() });
  };

  if (overdueTasks.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={20} />
            Overdue Review
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""}. Reschedule or review them below.
        </p>

        <div className="max-h-60 overflow-y-auto space-y-2 my-3">
          {overdueTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-destructive/20 bg-destructive/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-destructive">
                  Due {task.due_date ? format(new Date(task.due_date), "MMM d") : ""}
                </p>
              </div>
              <button
                onClick={() => handleRescheduleOne(task.id)}
                className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
              >
                <CalendarClock size={12} /> Today
              </button>
              <button
                onClick={() => { onEditTask(task); onOpenChange(false); }}
                className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
          <Button onClick={handleMoveAllToToday} className="gap-2">
            <CalendarClock size={14} />
            Move all to today
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverdueReviewModal;
