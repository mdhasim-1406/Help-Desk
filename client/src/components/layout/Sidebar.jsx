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

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between px-8 border-b border-border/40">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <LifeBuoy className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">HelpDesk Pro</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest pl-0.5">Enterprise</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-8 custom-scrollbar">
          <div className="mb-4 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Menu</p>
          </div>

          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <div className="relative z-10 flex items-center gap-3.5">
                <link.icon className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-300",
                  location.pathname.startsWith(link.path) ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground/80"
                )} strokeWidth={1.5} />
                <span>{link.name}</span>
              </div>

              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border/40 p-6">
          <div className="rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 p-5 border border-white/50 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors duration-500" />

            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-foreground/80 mb-1">
                <HelpCircle className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold">Support Center</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Need assistance? Our team is visible 24/7 for critical issues.
              </p>
              <button className="mt-2 text-[11px] font-bold text-primary hover:text-primary-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                Contact Support <ChevronLeft className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
