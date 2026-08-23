import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Menu, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import api from '../../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenCreateTask: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenCreateTask, onToggleMobileSidebar }) => {
  const { currentProject, currentUserRole } = useProject();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-4 backdrop-blur-md">
      {/* Left: Mobile Menu Toggle & Active Project Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {currentProject && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary-container/20 px-2 py-0.5 font-mono text-[11px] font-bold text-primary border border-primary/20">
              {currentProject.key}
            </span>
            <h2 className="text-sm font-semibold text-on-surface truncate hidden sm:block">
              {currentProject.name}
            </h2>
            {currentUserRole && (
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium text-outline uppercase tracking-wider">
                {currentUserRole}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Actions: Search, Notifications, New Task */}
      <div className="flex items-center gap-3">
        {/* Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 text-xs text-outline hover:border-outline hover:text-on-surface transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search tasks, projects...</span>
          <kbd className="hidden md:inline-block rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-mono text-outline">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-outline-variant/40 bg-surface-container-low shadow-xl p-3 z-50">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-outline-variant/30">
                <h3 className="text-xs font-semibold text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-outline text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        n.read ? 'bg-surface-container/40' : 'bg-surface-container-high border-l-2 border-primary'
                      }`}
                    >
                      <p className="font-medium text-on-surface">{n.title}</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-outline mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* New Task Button */}
        {currentUserRole !== 'VIEWER' && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-medium text-on-primary shadow-sm hover:bg-primary-container/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}
      </div>
    </header>
  );
};
