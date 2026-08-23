import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, CheckCircle2, Clock, AlertTriangle, FolderKanban, Briefcase } from 'lucide-react';
import api from '../../services/api';

interface MemberProfileDrawerProps {
  memberId: string | null;
  onClose: () => void;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    createdAt: string;
  };
  stats: {
    assignedTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
  };
  projects: {
    id: string;
    name: string;
    key: string;
    status: string;
    role: string;
  }[];
}

export const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({ memberId, onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (memberId) {
      fetchProfile(memberId);
    }
  }, [memberId]);

  const fetchProfile = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/team/member/${id}/profile`);
      setProfile(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load member profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!memberId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-container-low border-l border-outline-variant/30 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Member Profile</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-xs text-outline animate-pulse">Loading member profile...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-error-container/30 border border-error/30 p-4 text-xs text-error">
                {error}
              </div>
            ) : profile ? (
              <>
                {/* Header Identity Box */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                  <img
                    src={profile.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.name)}`}
                    alt={profile.user.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div>
                    <h2 className="text-base font-bold text-on-surface">{profile.user.name}</h2>
                    <p className="text-xs text-outline flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {profile.user.email}
                    </p>
                    <span className="inline-block mt-2 rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 uppercase">
                      {profile.user.role}
                    </span>
                  </div>
                </div>

                {/* Productivity Summary Grid */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">
                    Productivity Overview
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                      <span className="text-[10px] text-outline font-bold uppercase block mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-tertiary" /> Active Tasks
                      </span>
                      <span className="text-lg font-bold text-on-surface">{profile.stats.activeTasks}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                      <span className="text-[10px] text-outline font-bold uppercase block mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-secondary" /> Completed
                      </span>
                      <span className="text-lg font-bold text-secondary">{profile.stats.completedTasks}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                      <span className="text-[10px] text-outline font-bold uppercase block mb-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-primary" /> Total Assigned
                      </span>
                      <span className="text-lg font-bold text-primary">{profile.stats.assignedTasks}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                      <span className="text-[10px] text-outline font-bold uppercase block mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-error" /> Overdue Tasks
                      </span>
                      <span className="text-lg font-bold text-error">{profile.stats.overdueTasks}</span>
                    </div>
                  </div>
                </div>

                {/* Authorized Project Memberships */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-primary" />
                    Authorized Shared Projects ({profile.projects.length})
                  </h4>

                  <div className="space-y-2">
                    {profile.projects.length === 0 ? (
                      <p className="text-xs text-outline italic">No shared project memberships.</p>
                    ) : (
                      profile.projects.map((proj) => (
                        <div
                          key={proj.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs"
                        >
                          <div>
                            <span className="font-mono text-primary font-bold mr-2">[{proj.key}]</span>
                            <span className="font-semibold text-on-surface">{proj.name}</span>
                          </div>
                          <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-outline uppercase">
                            {proj.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
