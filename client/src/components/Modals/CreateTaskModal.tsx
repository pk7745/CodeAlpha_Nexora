import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { Task, useProject } from '../../context/ProjectContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: Task['status'];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, initialStatus = 'TODO' }) => {
  const { createTask, currentProject } = useProject();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>(initialStatus);
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      await createTask({
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Create Task in {currentProject?.name}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket project room broadcasts"
              className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Unassigned</option>
                {currentProject?.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and acceptance criteria..."
              className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-outline hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-container px-4 py-2 text-xs font-medium text-on-primary hover:bg-primary-container/90 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
