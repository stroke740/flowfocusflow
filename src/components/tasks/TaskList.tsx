import { useCallback } from "react";
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

const TaskList = ({ tasks, onEditTask }: TaskListProps) => {
  const { completeTask, deleteTask } = useTaskMutations();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const { toast } = useToast();

  const handleSwipeComplete = useCallback((task: Task) => {
    completeTask.mutate(task.id);
  }, [completeTask]);

  const handleSwipeDelete = useCallback((task: Task) => {
    deleteTask.mutate(task.id);
    toast({ title: "Task deleted", description: "This action cannot be undone." });
  }, [deleteTask, toast]);

  if (!tasks.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm">No tasks yet. Add one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
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
};

export default TaskList;
