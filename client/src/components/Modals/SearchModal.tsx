import React, { useState, useEffect } from 'react';
import { Search, X, Folder, CheckSquare, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import api from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: any[]; tasks: any[]; users: any[] }>({
    projects: [],
    tasks: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const { selectProject, setSelectedTask, tasks } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length > 0) {
        setLoading(true);
        try {
          const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
          setResults(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ projects: [], tasks: [], users: [] });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
          <Search className="h-5 w-5 text-primary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks (NXR-101), or team members..."
            className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {loading && <p className="text-outline text-center py-4">Searching database...</p>}

          {!loading && query.trim() !== '' && results.projects.length === 0 && results.tasks.length === 0 && results.users.length === 0 && (
            <p className="text-outline text-center py-4">No results found for "{query}".</p>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary" /> Projects
              </h4>
              <div className="space-y-1">
                {results.projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      selectProject(p.id);
                      navigate(`/projects/${p.id}`);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-semibold text-on-surface">[{p.key}] {p.name}</span>
                    <span className="text-[10px] text-outline truncate max-w-xs">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-primary" /> Tasks
              </h4>
              <div className="space-y-1">
                {results.tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      const fullTask = tasks.find((tk) => tk.id === t.id) || t;
                      setSelectedTask(fullTask);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-bold">{t.key}</span>
                      <span className="text-on-surface font-medium">{t.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-outline">{t.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-primary" /> Team Members
              </h4>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center gap-3"
                  >
                    <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-on-surface">{u.name}</p>
                      <p className="text-[10px] text-outline">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
