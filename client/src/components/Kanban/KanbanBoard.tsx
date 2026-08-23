import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Task, useProject } from '../../context/ProjectContext';

interface KanbanBoardProps {
  onOpenCreateTask: (status: Task['status']) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenCreateTask }) => {
  const { tasks, moveTask } = useProject();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'IN_REVIEW', title: 'In Review' },
    { id: 'DONE', title: 'Done' },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Check if over target is a column status or a task card
    let targetStatus: Task['status'];
    let targetOverTask: Task | undefined;

    if (['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(overId)) {
      targetStatus = overId as Task['status'];
    } else {
      targetOverTask = tasks.find((t) => t.id === overId);
      if (!targetOverTask) return;
      targetStatus = targetOverTask.status;
    }

    const columnTasks = getTasksByStatus(targetStatus);

    let newPosition = 1000.0;

    if (targetOverTask) {
      const overIndex = columnTasks.findIndex((t) => t.id === targetOverTask!.id);
      const prevTask = columnTasks[overIndex - 1];
      const nextTask = columnTasks[overIndex + 1];

      if (!prevTask) {
        newPosition = targetOverTask.position / 2;
      } else if (!nextTask) {
        newPosition = targetOverTask.position + 1000.0;
      } else {
        newPosition = (prevTask.position + targetOverTask.position) / 2;
      }
    } else {
      // Dropped on empty column or bottom
      const lastTask = columnTasks[columnTasks.length - 1];
      newPosition = lastTask ? lastTask.position + 1000.0 : 1000.0;
    }

    moveTask(activeId, targetStatus, newPosition);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-8.5rem)]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={getTasksByStatus(col.id)}
            onOpenCreateTask={onOpenCreateTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
