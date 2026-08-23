import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import api from '../../services/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { fetchProjects, selectProject } = useProject();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/projects', { name, key, description });
      await fetchProjects();
      await selectProject(res.data.project.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Create New Project
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container/30 border border-error/30 p-3 text-xs text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key) {
                  setKey(e.target.value.substring(0, 3).toUpperCase());
                }
              }}
              placeholder="e.g. Mobile App Redesign"
              className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Project Key (2-10 Uppercase Characters)</label>
            <input
              type="text"
              required
              maxLength={10}
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. NXR"
              className="w-full rounded-lg bg-surface-container border border-outline-variant/40 p-2.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of project goals and scope..."
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
