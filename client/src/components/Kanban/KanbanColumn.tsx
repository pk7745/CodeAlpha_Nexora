import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task, useProject } from '../../context/ProjectContext';

interface KanbanColumnProps {
  id: Task['status'];
  title: string;
  tasks: Task[];
  onOpenCreateTask: (status: Task['status']) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, onOpenCreateTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { currentUserRole } = useProject();

  const getBadgeColor = () => {
    switch (id) {
      case 'TODO':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'IN_PROGRESS':
        return 'bg-primary-container/20 text-primary border border-primary/20';
      case 'IN_REVIEW':
        return 'bg-tertiary-container/20 text-tertiary border border-tertiary/20';
      case 'DONE':
        return 'bg-secondary-container/20 text-secondary border border-secondary/20';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        kanban-col flex flex-col rounded-2xl bg-surface-container-lowest/60 border border-outline-variant/30 p-3 h-full transition-colors duration-200
        ${isOver ? 'border-primary/50 bg-surface-container/50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">{title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getBadgeColor()}`}>
            {tasks.length}
          </span>
        </div>
        {currentUserRole !== 'VIEWER' && (
          <button
            onClick={() => onOpenCreateTask(id)}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[150px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
