import { useCallback, forwardRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";
import SwipeableTaskWrapper from "./SwipeableTaskWrapper";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const TaskList = forwardRef<HTMLDivElement, TaskListProps>(({ tasks, onEditTask }, ref) => {
  const { completeTask, deleteTask } = useTaskMutations();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const { toast } = useToast();

  const handleSwipeComplete = useCallback((task: Task) => {
    completeTask.mutate(task.id);
  }, [completeTask]);

  const handleSwipeDelete = useCallback((task: Task) => {
    deleteTask.mutate(task.id);
    toast({ title: "Task deleted" });
  }, [deleteTask, toast]);

  if (!tasks.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground/50 text-[13px]">No tasks</p>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <SwipeableTaskWrapper
            key={task.id}
            onSwipeRight={() => handleSwipeComplete(task)}
            onSwipeLeft={() => handleSwipeDelete(task)}
          >
            <TaskCard
              task={task}
              onEdit={onEditTask}
              completionCount={completedCount}
            />
          </SwipeableTaskWrapper>
        ))}
      </AnimatePresence>
    </div>
  );
});

TaskList.displayName = "TaskList";

export default TaskList;
