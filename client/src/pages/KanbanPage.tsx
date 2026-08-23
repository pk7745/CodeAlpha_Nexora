import React, { useState } from 'react';
import { KanbanBoard } from '../components/Kanban/KanbanBoard';
import { CreateTaskModal } from '../components/Modals/CreateTaskModal';
import { Task, useProject } from '../context/ProjectContext';
import { Plus, Filter } from 'lucide-react';

export const KanbanPage: React.FC = () => {
  const { currentProject, currentUserRole } = useProject();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<Task['status']>('TODO');

  const handleOpenCreateTask = (status: Task['status'] = 'TODO') => {
    setInitialStatus(status);
    setIsCreateTaskOpen(true);
  };

  if (!currentProject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xs text-outline">Select or create a project to view the Kanban board.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">{currentProject.name} Board</h1>
            <span className="rounded bg-primary-container/20 px-2 py-0.5 font-mono text-xs font-bold text-primary border border-primary/20">
              [{currentProject.key}]
            </span>
          </div>
          <p className="text-xs text-outline mt-0.5">{currentProject.description}</p>
        </div>

        <div className="flex items-center gap-3">
          {currentUserRole !== 'VIEWER' && (
            <button
              onClick={() => handleOpenCreateTask('TODO')}
              className="flex items-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary shadow-md shadow-primary-container/20 hover:bg-primary-container/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Drag-and-Drop Kanban Board */}
      <KanbanBoard onOpenCreateTask={handleOpenCreateTask} />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        initialStatus={initialStatus}
      />
    </div>
  );
};
