import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";
import SwipeableTaskWrapper from "./SwipeableTaskWrapper";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const SortableTaskItem = ({
  task,
  onEditTask,
  completedCount,
  isMobile,
  onSwipeComplete,
  onSwipeDelete,
}: {
  task: Task;
  onEditTask: (task: Task) => void;
  completedCount: number;
  isMobile: boolean;
  onSwipeComplete: (task: Task) => void;
  onSwipeDelete: (task: Task) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  const card = (
    <TaskCard
      task={task}
      onEdit={onEditTask}
      completionCount={completedCount}
      dragHandleProps={isMobile ? {} : { ...attributes, ...listeners }}
    />
  );

  return (
    <div ref={setNodeRef} style={style}>
      {isMobile ? (
        <SwipeableTaskWrapper
          onSwipeRight={() => onSwipeComplete(task)}
          onSwipeLeft={() => onSwipeDelete(task)}
        >
          {card}
        </SwipeableTaskWrapper>
      ) : (
        card
      )}
    </div>
  );
};

const TaskList = ({ tasks, onEditTask }: TaskListProps) => {
  const { reorderTasks, completeTask, deleteTask } = useTaskMutations();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      reorderTasks.mutate(newOrder.map((t, i) => ({ id: t.id, position: i })));
    },
    [tasks, reorderTasks]
  );

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                completedCount={completedCount}
                isMobile={isMobile}
                onSwipeComplete={handleSwipeComplete}
                onSwipeDelete={handleSwipeDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
