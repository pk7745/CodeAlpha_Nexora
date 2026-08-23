import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Calendar } from 'lucide-react';
import { Task, useProject } from '../../context/ProjectContext';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay = false }) => {
  const { setSelectedTask } = useProject();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="rounded bg-error-container/30 px-2 py-0.5 text-[10px] font-bold text-error border border-error/30">URGENT</span>;
      case 'HIGH':
        return <span className="rounded bg-tertiary-container/30 px-2 py-0.5 text-[10px] font-bold text-tertiary border border-tertiary/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">MEDIUM</span>;
      case 'LOW':
        return <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-medium text-outline">LOW</span>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTask(task)}
      className={`
        group relative rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5 shadow-sm transition-all duration-200 hover:border-outline-variant hover:bg-surface-container cursor-grab active:cursor-grabbing
        ${isOverlay ? 'rotate-2 scale-105 shadow-2xl border-primary/50' : ''}
      `}
    >
      {/* Task Header: Key Tag & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-bold text-outline group-hover:text-primary transition-colors">
          {task.key}
        </span>
        {getPriorityBadge(task.priority)}
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-semibold text-on-surface line-clamp-2 mb-3 leading-snug">
        {task.title}
      </h3>

      {/* Task Footer: Assignee, Comments, Due Date */}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
        <div className="flex items-center gap-3 text-[11px] text-outline">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(task._count?.comments || 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task._count?.comments}
            </span>
          )}
        </div>

        {task.assignee ? (
          <img
            src={task.assignee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}`}
            alt={task.assignee.name}
            title={task.assignee.name}
            className="h-6 w-6 rounded-full object-cover border border-outline-variant/40"
          />
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-outline-variant/40 flex items-center justify-center text-[10px] text-outline">
            ?
          </div>
        )}
      </div>
    </div>
  );
};
