import React from 'react';
import { useProject } from '../context/ProjectContext';
import { FolderKanban, Users, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const ProjectOverviewPage: React.FC = () => {
  const { currentProject, tasks } = useProject();

  if (!currentProject) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Overview Header */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary font-bold text-xl shadow-md">
              {currentProject.key}
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface">{currentProject.name}</h1>
              <span className="text-xs text-outline">Project ID: {currentProject.id}</span>
            </div>
          </div>
          <span className="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
            {currentProject.status}
          </span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed mb-6 max-w-2xl">
          {currentProject.description}
        </p>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-on-surface">Overall Project Completion</span>
            <span className="text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
          <span className="text-xs font-semibold text-outline block mb-2">Total Project Tasks</span>
          <p className="text-2xl font-bold text-on-surface">{totalTasks}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
          <span className="text-xs font-semibold text-tertiary block mb-2">In Progress</span>
          <p className="text-2xl font-bold text-tertiary">{inProgressTasks}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
          <span className="text-xs font-semibold text-secondary block mb-2">Completed Tasks</span>
          <p className="text-2xl font-bold text-secondary">{completedTasks}</p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Project Team Roster ({currentProject.members.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentProject.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <img src={m.user.avatarUrl} alt={m.user.name} className="h-8 w-8 rounded-full object-cover border border-outline-variant/40" />
              <div className="truncate">
                <p className="text-xs font-semibold text-on-surface truncate">{m.user.name}</p>
                <span className="text-[10px] text-primary font-bold uppercase">{m.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
