import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, User } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await axiosInstance.get('/notifications/unread-count');
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 30000); // Poll every 30s as requested

    return () => clearInterval(intervalId);
  }, []);

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
        <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-slow"></span>
          )}
        </button>
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
