import React from 'react';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TicketList from '@/components/tickets/TicketList';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card className="flex items-center gap-4">
    <div className={cn(
      "p-3 rounded-xl",
      color === 'blue' && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      color === 'amber' && "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      color === 'emerald' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      color === 'rose' && "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
    )}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </Card>
);

const CustomerDashboard = ({ stats, recentTickets, isLoading }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Portal</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your support requests.</p>
        </div>
        <Link to="/customer/tickets/new">
          <Button icon={Plus}>Submit New Ticket</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="All Tickets" value={stats?.total || 0} icon={Ticket} color="blue" />
        <StatCard label="Pending" value={stats?.pending || 0} icon={Clock} color="amber" />
        <StatCard label="Resolved" value={stats?.resolved || 0} icon={CheckCircle} color="emerald" />
        <StatCard label="Urgent" value={stats?.urgent || 0} icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Tickets</h2>
            <Link to="/customer/tickets" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <TicketList 
            tickets={recentTickets} 
            isLoading={isLoading} 
            emptyMessage="You haven't submitted any tickets yet."
          />
        </div>

        {/* Quick Links / Help */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Help</h2>
          <Card className="space-y-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/20">
              <h3 className="font-bold text-primary-900 dark:text-primary-100 text-sm">Need a fast answer?</h3>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                Check our Knowledge Base for quick solutions to common problems.
              </p>
              <Link to="/customer/kb">
                <Button variant="primary" size="sm" className="w-full mt-4">Browse Articles</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Common Topics</h4>
              <ul className="space-y-2">
                {['Setting up your account', 'Billing and Invoices', 'Security settings'].map(item => (
                  <li key={item}>
                    <button className="text-sm text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
