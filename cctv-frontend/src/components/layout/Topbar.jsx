import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, X } from 'lucide-react';
import { notificationApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications({ page: 0, size: 10 });
      setNotifications(res.data.content || []);
    } catch (err) {
      console.error("Failed to fetch notifications list", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(intervalId);
  }, []);

  // Fetch when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tickets, customers..." 
            className="pl-9 pr-4 py-2 bg-white border border-slate-300 focus:border-primary-500 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-full hover:bg-slate-100 transition-colors ${isOpen ? 'bg-slate-100 text-primary-600' : 'text-slate-500'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  {user?.role === 'admin' && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block">
                      System Notifications
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No notifications yet</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-blue-50/30 hover:bg-blue-50/50' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        {user?.role === 'admin' && notif.user_name && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              For: {notif.user_name}
                            </span>
                          </div>
                        )}
                      </div>
                      {!notif.is_read && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Role'}</p>
          </div>
          <button onClick={logout} className="text-xs font-medium text-red-500 hover:text-red-600 ml-2">Logout</button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
