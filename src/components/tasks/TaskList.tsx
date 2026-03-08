import { useCallback, forwardRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";
import SwipeableTaskWrapper from "./SwipeableTaskWrapper";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { showUndoToast } from "@/components/tasks/UndoToast";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  enableDragDrop?: boolean;
}

function SortableTaskItem({ task, onEdit, completedCount, onSwipeComplete, onSwipeDelete }: {
  task: Task;
  onEdit: (task: Task) => void;
  completedCount: number;
  onSwipeComplete: () => void;
  onSwipeDelete: () => void;
}) {
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
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 p-1 rounded-md",
          "opacity-0 group-hover/drag:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing",
          "touch-none transition-opacity duration-150"
        )}
      >
        <GripVertical size={14} className="text-muted-foreground" />
      </div>
      <SwipeableTaskWrapper
        onSwipeRight={onSwipeComplete}
        onSwipeLeft={onSwipeDelete}
      >
        <TaskCard
          task={task}
          onEdit={onEdit}
          completionCount={completedCount}
        />
      </SwipeableTaskWrapper>
    </div>
  );
}

const TaskList = forwardRef<HTMLDivElement, TaskListProps>(({ tasks, onEditTask, enableDragDrop = true }, ref) => {
  const { completeTask, deleteTask, reorderTasks, addTask } = useTaskMutations();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleSwipeComplete = useCallback((task: Task) => {
    completeTask.mutate(task.id);
  }, [completeTask]);

  const handleSwipeDelete = useCallback((task: Task) => {
    deleteTask.mutate(task.id);
    showUndoToast(`"${task.title}" deleted`, () => {
      // Re-add the deleted task
      addTask.mutate({ title: task.title, priority: task.priority, due_date: task.due_date, description: task.description, project_id: task.project_id });
    });
  }, [deleteTask, addTask]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((t, i) => ({ id: t.id, position: i }));
    reorderTasks.mutate(updates);
  }, [tasks, reorderTasks]);

  if (!tasks.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground/40 text-[13px]">No tasks yet</p>
      </div>
    );
  }

  if (enableDragDrop) {
    return (
      <div ref={ref} className="rounded-xl">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  completedCount={completedCount}
                  onSwipeComplete={() => handleSwipeComplete(task)}
                  onSwipeDelete={() => handleSwipeDelete(task)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  return (
    <div ref={ref} className="rounded-xl">
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
