import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject, Task } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter } from 'lucide-react';

export const TaskListPage: React.FC = () => {
  const { tasks, setSelectedTask } = useProject();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState<boolean>(false);
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'assignedToMe') {
      setAssignedToMeFilter(true);
      setStatusFilter('ALL');
      setOverdueFilter(false);
    } else if (filterParam === 'DONE') {
      setStatusFilter('DONE');
      setAssignedToMeFilter(false);
      setOverdueFilter(false);
    } else if (filterParam === 'overdue') {
      setOverdueFilter(true);
      setAssignedToMeFilter(false);
      setStatusFilter('ALL');
    }
  }, [searchParams]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesAssigned = !assignedToMeFilter || (user && t.assigneeId === user.id);
    
    let matchesOverdue = true;
    if (overdueFilter) {
      const isPastDue = t.dueDate ? new Date(t.dueDate) < new Date() : false;
      matchesOverdue = isPastDue && t.status !== 'DONE';
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesAssigned && matchesOverdue;
  });

  const getActiveFilterLabel = () => {
    if (assignedToMeFilter) return 'Assigned to Me';
    if (overdueFilter) return 'Overdue Tasks';
    if (statusFilter === 'DONE') return 'Completed Tasks';
    return null;
  };

  const activeFilterLabel = getActiveFilterLabel();

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">Task List View</h1>
            {activeFilterLabel && (
              <span className="rounded-full bg-primary-container/20 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {activeFilterLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-outline mt-0.5">Search, filter, and inspect tasks across project milestones.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="rounded-xl bg-surface-container border border-outline-variant/40 py-1.5 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-outline" />
          </div>

          {/* Quick Filter Options */}
          <button
            onClick={() => {
              setAssignedToMeFilter(!assignedToMeFilter);
              setOverdueFilter(false);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
              assignedToMeFilter 
                ? 'bg-primary-container/20 text-primary border-primary/40 font-bold' 
                : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
            }`}
          >
            Assigned to Me
          </button>

          <button
            onClick={() => {
              setOverdueFilter(!overdueFilter);
              setAssignedToMeFilter(false);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
              overdueFilter 
                ? 'bg-error-container/20 text-error border-error/40 font-bold' 
                : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
            }`}
          >
            Overdue
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOverdueFilter(false);
            }}
            className="rounded-xl bg-surface-container border border-outline-variant/40 py-1.5 px-3 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl bg-surface-container border border-outline-variant/40 py-1.5 px-3 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Task List Table */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-lowest border-b border-outline-variant/30 text-outline uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Key</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-outline">
                  No tasks found matching current filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-surface-container/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-primary">{task.key}</td>
                  <td className="py-3 px-4 font-medium text-on-surface">{task.title}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface uppercase">
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-tertiary-container/20 px-2 py-0.5 text-[10px] font-bold text-tertiary">
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <img src={task.assignee.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-outline italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-outline">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
