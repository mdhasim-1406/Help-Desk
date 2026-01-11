import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  FileText, 
  LifeBuoy, 
  Settings, 
  ChevronLeft,
  PieChart,
  Shield,
  HelpCircle,
  X,
  Building2,
  Clock,
  User
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/helpers';
import { normalizeToString } from '@/utils/normalize';

const Sidebar = () => {
  const { user } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  // Get the base path for the current user's role
  const getBasePath = () => {
    const role = normalizeToString(user?.role, 'CUSTOMER').toUpperCase();
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'AGENT':
        return '/agent';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const basePath = getBasePath();

  const getNavLinks = () => {
    const role = normalizeToString(user?.role, 'CUSTOMER').toUpperCase();

    // Customer navigation
    if (role === 'CUSTOMER') {
      return [
        { name: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
        { name: 'My Tickets', path: `${basePath}/tickets`, icon: Ticket },
        { name: 'New Ticket', path: `${basePath}/tickets/new`, icon: FileText },
        { name: 'Knowledge Base', path: `${basePath}/kb`, icon: HelpCircle },
        { name: 'Profile', path: `${basePath}/profile`, icon: User },
      ];
    }

    // Agent navigation
    if (role === 'AGENT') {
      return [
        { name: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
        { name: 'Ticket Queue', path: `${basePath}/tickets`, icon: Ticket },
        { name: 'Knowledge Base', path: `${basePath}/kb`, icon: HelpCircle },
        { name: 'Profile', path: `${basePath}/profile`, icon: User },
      ];
    }

    // Manager navigation
    if (role === 'MANAGER') {
      return [
        { name: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
        { name: 'Department Tickets', path: `${basePath}/tickets`, icon: Ticket },
        { name: 'Team Management', path: `${basePath}/team`, icon: Users },
        { name: 'Reports', path: `${basePath}/reports`, icon: PieChart },
        { name: 'Knowledge Base', path: `${basePath}/kb`, icon: HelpCircle },
        { name: 'Profile', path: `${basePath}/profile`, icon: User },
      ];
    }

    // Admin navigation
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return [
        { name: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
        { name: 'All Tickets', path: `${basePath}/tickets`, icon: Ticket },
        { name: 'Users', path: `${basePath}/users`, icon: Users },
        { name: 'Departments', path: `${basePath}/departments`, icon: Building2 },
        { name: 'SLA Policies', path: `${basePath}/sla`, icon: Clock },
        { name: 'Knowledge Base', path: `${basePath}/kb`, icon: HelpCircle },
        { name: 'Reports', path: `${basePath}/reports`, icon: PieChart },
        { name: 'Settings', path: `${basePath}/settings`, icon: Settings },
        { name: 'Profile', path: `${basePath}/profile`, icon: User },
      ];
    }

    // Default fallback
    return [
      { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900",
        !isSidebarOpen && "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <LifeBuoy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">HelpDesk Pro</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
          </div>
          
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <link.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                location.pathname.startsWith(link.path) ? "text-primary-600 dark:text-primary-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )} />
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Need Help?</p>
              <p className="text-[11px] text-slate-500">Contact our technical support for any issues.</p>
              <button className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Documentation
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
