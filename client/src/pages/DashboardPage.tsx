import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity as ActivityIcon,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import api from '../services/api';

interface Stats {
  activeProjects: number;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  statusBreakdown: {
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  };
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject, setSelectedTask } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.stats);
        setActivities(res.data.recentActivities);
        setDeadlines(res.data.upcomingDeadlines);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xs text-outline animate-pulse">Calculating database statistics...</p>
      </div>
    );
  }

  const handleKpiClick = (type: 'projects' | 'assigned' | 'completed' | 'overdue') => {
    if (!currentProject) return;
    switch (type) {
      case 'projects':
        navigate(`/projects/${currentProject.id}/overview`);
        break;
      case 'assigned':
        navigate(`/projects/${currentProject.id}/tasks?filter=assignedToMe`);
        break;
      case 'completed':
        navigate(`/projects/${currentProject.id}/tasks?filter=DONE`);
        break;
      case 'overdue':
        navigate(`/projects/${currentProject.id}/tasks?filter=overdue`);
        break;
    }
  };

  const statCards = [
    { 
      id: 'projects',
      label: 'Active Projects', 
      value: stats?.activeProjects || 0, 
      icon: FolderKanban, 
      color: 'text-primary border-primary/20 bg-primary-container/10',
      action: () => handleKpiClick('projects'),
    },
    { 
      id: 'assigned',
      label: 'Assigned Tasks', 
      value: stats?.assignedTasks || 0, 
      icon: Clock, 
      color: 'text-tertiary border-tertiary/20 bg-tertiary-container/10',
      action: () => handleKpiClick('assigned'),
    },
    { 
      id: 'completed',
      label: 'Completed Tasks', 
      value: stats?.completedTasks || 0, 
      icon: CheckCircle2, 
      color: 'text-secondary border-secondary/20 bg-secondary-container/10',
      action: () => handleKpiClick('completed'),
    },
    { 
      id: 'overdue',
      label: 'Overdue Tasks', 
      value: stats?.overdueTasks || 0, 
      icon: AlertTriangle, 
      color: 'text-error border-error/20 bg-error-container/10',
      action: () => handleKpiClick('overdue'),
    },
  ];

  const totalTasks = (stats?.statusBreakdown.todo || 0) + 
                     (stats?.statusBreakdown.inProgress || 0) + 
                     (stats?.statusBreakdown.inReview || 0) + 
                     (stats?.statusBreakdown.done || 0);

  const completionRate = totalTasks > 0 ? Math.round(((stats?.statusBreakdown.done || 0) / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-on-surface tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-outline">Real-time dynamic project management metrics aggregated from database state.</p>
      </div>

      {/* Dynamic Actionable Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.action}
              className="group text-left rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-surface-container hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-outline group-hover:text-on-surface transition-colors flex items-center gap-1">
                  {card.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{card.value}</p>
            </button>
          );
        })}
      </div>

      {/* Workspace Health & Productivity Insights */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Workspace Productivity Overview
          </h3>
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {completionRate}% Completion Rate
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-surface-container-highest overflow-hidden flex">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? ((stats?.statusBreakdown.done || 0) / totalTasks) * 100 : 0}%` }}
              title={`Completed: ${stats?.statusBreakdown.done}`}
            />
            <div
              className="h-full bg-tertiary transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? ((stats?.statusBreakdown.inReview || 0) / totalTasks) * 100 : 0}%` }}
              title={`In Review: ${stats?.statusBreakdown.inReview}`}
            />
            <div
              className="h-full bg-primary-container transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? ((stats?.statusBreakdown.inProgress || 0) / totalTasks) * 100 : 0}%` }}
              title={`In Progress: ${stats?.statusBreakdown.inProgress}`}
            />
            <div
              className="h-full bg-surface-container-highest transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? ((stats?.statusBreakdown.todo || 0) / totalTasks) * 100 : 0}%` }}
              title={`To Do: ${stats?.statusBreakdown.todo}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-outline pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary"></span> Done ({stats?.statusBreakdown.done})</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary"></span> Review ({stats?.statusBreakdown.inReview})</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container"></span> In Progress ({stats?.statusBreakdown.inProgress})</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-surface-container-highest"></span> To Do ({stats?.statusBreakdown.todo})</span>
            </div>
            <span className="font-semibold text-on-surface">{totalTasks} Total Tasks</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Upcoming Deadlines & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Upcoming Task Deadlines */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Task Deadlines
          </h3>
          <div className="space-y-2.5">
            {deadlines.length === 0 ? (
              <p className="text-xs text-outline py-3">No upcoming deadlines.</p>
            ) : (
              deadlines.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="w-full group text-left flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-high transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-primary font-bold group-hover:underline">{t.key}</span>
                    <span className="font-semibold text-on-surface truncate max-w-xs group-hover:text-primary transition-colors">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-outline group-hover:text-on-surface transition-colors">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                    </span>
                    {t.assignee ? (
                      <img src={t.assignee.avatarUrl} alt={t.assignee.name} title={t.assignee.name} className="h-5 w-5 rounded-full object-cover border border-outline-variant/40" />
                    ) : (
                      <span className="text-[10px] text-outline italic">Unassigned</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Activity Audit Log */}
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-primary" />
            Live Project Audit Activity
          </h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-outline py-3">No recent activities.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-container/40 border border-outline-variant/20 text-xs">
                  <img src={act.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user?.name || 'U')}`} alt="" className="h-6 w-6 rounded-full object-cover mt-0.5" />
                  <div className="flex-1">
                    <p className="text-on-surface">
                      <span className="font-semibold text-primary">{act.user?.name}</span> {act.details}
                    </p>
                    <span className="text-[9px] text-outline mt-1 block">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
