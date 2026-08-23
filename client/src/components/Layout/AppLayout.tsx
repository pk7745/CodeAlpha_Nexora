import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CreateProjectModal } from '../Modals/CreateProjectModal';
import { CreateTaskModal } from '../Modals/CreateTaskModal';
import { SearchModal } from '../Modals/SearchModal';
import { TaskDetailDrawer } from '../TaskDrawer/TaskDetailDrawer';
import { Task } from '../../context/ProjectContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<Task['status']>('TODO');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Shortcut: Ctrl + K for Search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCreateTask = (status: Task['status'] = 'TODO') => {
    setCreateTaskInitialStatus(status);
    setIsCreateTaskOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCreateTask={() => handleOpenCreateTask('TODO')}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawer */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        initialStatus={createTaskInitialStatus}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <TaskDetailDrawer />
    </div>
  );
};
