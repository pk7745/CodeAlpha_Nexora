import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MessageSquare, Trash2, Send, Edit2, Check, Clock } from 'lucide-react';
import { Task, useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const TaskDetailDrawer: React.FC = () => {
  const { selectedTask, setSelectedTask, updateTask, deleteTask, currentProject, currentUserRole } = useProject();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('TODO');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setAssigneeId(selectedTask.assigneeId || '');
      setDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');

      fetchComments(selectedTask.id);
    }
  }, [selectedTask]);

  const fetchComments = async (taskId: string) => {
    try {
      const res = await api.get(`/comments/task/${taskId}`);
      setComments(res.data.comments);
    } catch (e) {
      console.error(e);
    }
  };

  if (!selectedTask) return null;

  const handleSaveField = async (fields: Partial<Task>) => {
    try {
      await updateTask(selectedTask.id, fields);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/comments/task/${selectedTask.id}`, { content: newComment });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, { content: editingCommentContent });
      setComments((prev) => prev.map((c) => (c.id === commentId ? res.data.comment : c)));
      setEditingCommentId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async () => {
    if (confirm(`Are you sure you want to delete task ${selectedTask.key}?`)) {
      await deleteTask(selectedTask.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-surface-container-low border-l border-outline-variant/30 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary-container/20 border border-primary/20">
                {selectedTask.key}
              </span>
              <span className="text-xs text-outline font-medium">in {currentProject?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {currentUserRole !== 'VIEWER' && (
                <button
                  onClick={handleDeleteTask}
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveField({ title })}
                disabled={currentUserRole === 'VIEWER'}
                className="w-full bg-transparent text-lg font-bold text-on-surface focus:outline-none border-b border-transparent focus:border-primary pb-1"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-container p-4 border border-outline-variant/30 text-xs">
              {/* Status */}
              <div>
                <label className="text-[11px] font-medium text-outline block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const val = e.target.value as Task['status'];
                    setStatus(val);
                    handleSaveField({ status: val });
                  }}
                  disabled={currentUserRole === 'VIEWER'}
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/40 p-2 text-on-surface font-medium focus:outline-none focus:border-primary"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-medium text-outline block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => {
                    const val = e.target.value as Task['priority'];
                    setPriority(val);
                    handleSaveField({ priority: val });
                  }}
                  disabled={currentUserRole === 'VIEWER'}
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/40 p-2 text-on-surface font-medium focus:outline-none focus:border-primary"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[11px] font-medium text-outline block mb-1">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setAssigneeId(val || '');
                    handleSaveField({ assigneeId: val });
                  }}
                  disabled={currentUserRole === 'VIEWER'}
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/40 p-2 text-on-surface font-medium focus:outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {currentProject?.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-[11px] font-medium text-outline block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleSaveField({ dueDate: e.target.value });
                  }}
                  disabled={currentUserRole === 'VIEWER'}
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/40 p-2 text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Description Editor */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-2">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveField({ description })}
                placeholder="Add a detailed description for this task..."
                disabled={currentUserRole === 'VIEWER'}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 p-3 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Comments Thread */}
            <div className="pt-4 border-t border-outline-variant/30">
              <h4 className="text-xs font-semibold text-on-surface flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-primary" />
                Comments ({comments.length})
              </h4>

              {/* Comments List */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-surface-container p-3 border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}`}
                          alt={c.author.name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-on-surface">{c.author.name}</span>
                        <span className="text-[10px] text-outline">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {user?.id === c.author.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingCommentContent(c.content);
                            }}
                            className="p-1 text-outline hover:text-on-surface"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="p-1 text-outline hover:text-error"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className="flex-1 bg-surface-container-high rounded border border-primary px-2 py-1 text-xs text-on-surface"
                        />
                        <button
                          onClick={() => handleUpdateComment(c.id)}
                          className="p-1 bg-primary-container text-on-primary rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant leading-relaxed">{c.content}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              {currentUserRole !== 'VIEWER' && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-lg bg-surface-container border border-outline-variant/40 px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-container px-3 py-2 text-xs font-medium text-on-primary hover:bg-primary-container/90 transition-colors flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
