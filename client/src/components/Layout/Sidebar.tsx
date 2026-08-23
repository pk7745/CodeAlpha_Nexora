import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  ListTodo, 
  FolderKanban, 
  Users, 
  Plus, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  onOpenCreateProject: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateProject, isOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { projects, currentProject, selectProject } = useProject();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeProjectId = currentProject?.id || (projects.length > 0 ? projects[0].id : null);

  const navItems = [
    { 
      id: 'dashboard',
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      exact: true,
    },
    { 
      id: 'kanban',
      label: 'Kanban Board', 
      path: activeProjectId ? `/projects/${activeProjectId}` : '/dashboard', 
      icon: Kanban,
      exact: true,
    },
    { 
      id: 'tasks',
      label: 'Task List', 
      path: activeProjectId ? `/projects/${activeProjectId}/tasks` : '/dashboard', 
      icon: ListTodo,
      exact: false,
    },
    { 
      id: 'overview',
      label: 'Project Overview', 
      path: activeProjectId ? `/projects/${activeProjectId}/overview` : '/dashboard', 
      icon: FolderKanban,
      exact: false,
    },
    { 
      id: 'team',
      label: 'Team Members', 
      path: activeProjectId ? `/projects/${activeProjectId}/team` : '/dashboard', 
      icon: Users,
      exact: false,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-outline-variant/30 bg-surface-container-low transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header & Project Switcher */}
        <div className="p-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary font-bold text-lg shadow-md shadow-primary-container/20">
              N
            </div>
            <div>
              <h1 className="font-semibold text-on-surface tracking-tight text-base leading-none">Nexora</h1>
              <span className="text-[11px] text-outline font-medium tracking-wide uppercase">Project Platform</span>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="relative">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                if (e.target.value === 'NEW') {
                  onOpenCreateProject();
                } else {
                  selectProject(e.target.value);
                }
              }}
              className="w-full appearance-none rounded-lg bg-surface-container border border-outline-variant/40 py-2 pl-3 pr-8 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
              <option value="NEW">+ Create New Project...</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-outline pointer-events-none" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors
                  ${isActive 
                    ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Create Project Button */}
        <div className="p-3">
          <button
            onClick={onOpenCreateProject}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 py-2 text-xs font-medium text-on-surface transition-colors"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span>New Project</span>
          </button>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                alt={user?.name}
                className="h-8 w-8 rounded-full object-cover border border-outline-variant/40"
              />
              <div className="truncate">
                <p className="text-xs font-medium text-on-surface truncate">{user?.name}</p>
                <p className="text-[10px] text-outline truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
