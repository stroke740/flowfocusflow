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
import { useTaskMutations } from "@/hooks/use-tasks";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const SortableTaskItem = ({
  task,
  onEditTask,
  completedCount,
}: {
  task: Task;
  onEditTask: (task: Task) => void;
  completedCount: number;
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
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onEdit={onEditTask}
        completionCount={completedCount}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const TaskList = ({ tasks, onEditTask }: TaskListProps) => {
  const { reorderTasks } = useTaskMutations();
  const completedCount = tasks.filter((t) => t.status === "completed").length;

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
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
