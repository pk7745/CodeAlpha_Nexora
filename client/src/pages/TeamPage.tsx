import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { UserPlus, Trash2, Eye } from 'lucide-react';
import { MemberProfileDrawer } from '../components/Team/MemberProfileDrawer';
import api from '../services/api';

export const TeamPage: React.FC = () => {
  const { currentProject, currentUserRole, selectProject } = useProject();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      fetchMembers();
    }
  }, [currentProject]);

  const fetchMembers = async () => {
    if (!currentProject) return;
    try {
      const res = await api.get(`/team/project/${currentProject.id}`);
      setMembers(res.data.members);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post(`/team/project/${currentProject!.id}`, { email, role });
      setSuccess(`Added member ${email} as ${role}`);
      setEmail('');
      fetchMembers();
      selectProject(currentProject!.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member.');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await api.put(`/team/project/${currentProject!.id}/member/${memberId}`, { role: newRole });
      fetchMembers();
      selectProject(currentProject!.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from this project?`)) {
      try {
        await api.delete(`/team/project/${currentProject!.id}/member/${memberId}`);
        fetchMembers();
        selectProject(currentProject!.id);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to remove member');
      }
    }
  };

  if (!currentProject) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-lg font-bold text-on-surface tracking-tight">Team Management</h1>
          <p className="text-xs text-outline">Project roster, role assignments (Owner, Admin, Member, Viewer), and member productivity profiles.</p>
        </div>
      </div>

      {/* Add Member Box for Owner & Admin */}
      {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Invite Team Member
          </h3>

          {error && <p className="text-xs text-error mb-3 bg-error-container/20 p-2.5 rounded-lg border border-error/30">{error}</p>}
          {success && <p className="text-xs text-secondary mb-3 bg-secondary-container/20 p-2.5 rounded-lg border border-secondary/30">{success}</p>}

          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Registered user email (e.g. member@nexora.io)"
              className="flex-1 rounded-xl bg-surface-container border border-outline-variant/40 px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MEMBER">MEMBER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-container/90 transition-colors"
            >
              Add Member
            </button>
          </form>
        </div>
      )}

      {/* Team Roster Table */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-lowest border-b border-outline-variant/30 text-outline uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {members.map((m) => (
              <tr 
                key={m.id} 
                onClick={() => setSelectedMemberId(m.user.id)}
                className="hover:bg-surface-container/60 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img src={m.user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-outline-variant/40" />
                    <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{m.user.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-outline">{m.user.email}</td>
                <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                  {currentUserRole === 'OWNER' && m.role !== 'OWNER' ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                      className="rounded-lg bg-surface-container border border-outline-variant/40 px-2 py-1 text-xs font-bold text-primary focus:outline-none"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <span className="rounded bg-primary-container/20 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20">
                      {m.role}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-outline">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedMemberId(m.user.id)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
                      title="View Member Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.user.name)}
                        className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
};
