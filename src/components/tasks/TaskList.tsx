import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";
import { useTaskMutations } from "@/hooks/use-tasks";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const TaskList = ({ tasks, onEditTask }: TaskListProps) => {
  const { reorderTasks } = useTaskMutations();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (!draggedTask) return;

      const fromIndex = tasks.findIndex((t) => t.id === draggedTask.id);
      if (fromIndex === dropIndex) return;

      const newTasks = [...tasks];
      const [moved] = newTasks.splice(fromIndex, 1);
      newTasks.splice(dropIndex, 0, moved);

      reorderTasks.mutate(newTasks.map((t, i) => ({ id: t.id, position: i })));
      setDraggedTask(null);
      setDragOverIndex(null);
    },
    [draggedTask, tasks, reorderTasks]
  );

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
        {tasks.map((task, i) => (
          <div
            key={task.id}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            className={dragOverIndex === i ? "border-t-2 border-primary rounded-sm" : ""}
          >
            <TaskCard
              task={task}
              onEdit={onEditTask}
              onDragStart={setDraggedTask}
              completionCount={completedCount}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;
