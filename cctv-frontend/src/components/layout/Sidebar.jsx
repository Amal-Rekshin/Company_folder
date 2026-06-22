import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Briefcase, FileText, CreditCard, Settings, LogOut, MessageSquare, Target, FileSignature } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActiveItem = (itemPath) => {
    if (currentPath === itemPath) return true;
    if (['/admin', '/customer'].includes(itemPath)) {
      return currentPath === itemPath;
    }
    if (itemPath === '/technician') {
      return currentPath === '/technician' || currentPath.startsWith('/technician/jobs/');
    }
    if (itemPath === '/partner') {
      return currentPath === '/partner' || currentPath.startsWith('/partner/tickets/');
    }
    return currentPath.startsWith(itemPath + '/');
  };
  
  const getNavItems = () => {
    const role = user?.role || 'customer';
    switch(role) {
      case 'admin':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
          { name: 'Reports', icon: FileText, path: '/admin/reports' },
          { name: 'Queries', icon: MessageSquare, path: '/admin/queries' },
          { name: 'Leads', icon: Target, path: '/admin/leads' },
          { name: 'Quotations', icon: FileSignature, path: '/admin/quotations' },
          { name: 'Tickets', icon: Ticket, path: '/admin/tickets' },
          { name: 'Technicians', icon: Briefcase, path: '/admin/technicians' },
          { name: 'Partners', icon: Users, path: '/admin/partners' },
          { name: 'Settlements', icon: CreditCard, path: '/admin/settlements' },
        ];
      case 'technician':
        return [
          { name: 'My Jobs', icon: Briefcase, path: '/technician' },
          { name: 'Schedule', icon: LayoutDashboard, path: '/technician/schedule' },
        ];
      case 'partner':
        return [
          { name: 'Assignments', icon: Ticket, path: '/partner' },
          { name: 'Earnings', icon: CreditCard, path: '/partner/earnings' },
        ];
      case 'customer':
      default:
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/customer' },
          { name: 'My Tickets', icon: Ticket, path: '/customer/tickets' },
          { name: 'Invoices', icon: FileText, path: '/customer/invoices' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-dark-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-center h-16 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/20"></div>
          CCTV<span className="text-primary-400 font-light">Pro</span>
        </h1>
      </div>
      
      <nav className="p-4 space-y-1 mt-4">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menu</p>
        {navItems.map((item) => {
          const active = isActiveItem(item.path);
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-primary-500/10 text-primary-400 font-medium' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all">
          <Settings className="w-5 h-5" />
          Settings
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
