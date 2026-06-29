import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, User, Briefcase, FileText, CreditCard, Settings, LogOut, MessageSquare, Target, FileSignature } from 'lucide-react';
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
          { name: 'My Profile', icon: User, path: '/customer/profile' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 text-slate-600 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-center h-16 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary-600 shadow-sm flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">C</span>
          </div>
          CCTV<span className="text-primary-600 font-medium">Pro</span>
        </h1>
      </div>
      
      <nav className="p-4 space-y-1 mt-2">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
        {navItems.map((item) => {
          const active = isActiveItem(item.path);
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 transition-all ${
                active 
                  ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700 font-semibold' 
                  : 'border-l-4 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-200">
        <Link to={`/${user?.role || 'customer'}/settings`} className="flex items-center gap-3 px-3 py-2.5 border-l-4 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium text-slate-600 transition-all">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
