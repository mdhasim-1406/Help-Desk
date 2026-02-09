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
  <Card className="flex items-center gap-5 p-6 border-none shadow-soft hover:shadow-medium transition-all duration-300">
    <div className={cn(
      "p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110",
      color === 'blue' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      color === 'amber' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      color === 'emerald' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      color === 'rose' && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    )}>
      <Icon className="w-6 h-6" strokeWidth={2} />
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
    </div>
  </Card>
);

const CustomerDashboard = ({ stats, recentTickets, isLoading }) => {
  return (
    <div className="space-y-8 animate-enter">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer Portal</h1>
          <p className="text-muted-foreground mt-1">Track and manage your support requests.</p>
        </div>
        <Link to="/customer/tickets/new">
          <Button icon={Plus} size="lg" className="shadow-lg shadow-primary/20">Submit New Ticket</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="All Tickets" value={stats?.total || 0} icon={Ticket} color="blue" />
        <StatCard label="Pending" value={stats?.pending || 0} icon={Clock} color="amber" />
        <StatCard label="Resolved" value={stats?.resolved || 0} icon={CheckCircle} color="emerald" />
        <StatCard label="Urgent" value={stats?.urgent || 0} icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Tickets</h2>
            <Link to="/customer/tickets" className="text-sm font-semibold text-primary hover:text-primary-600 flex items-center gap-1 transition-colors group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-1">
            <TicketList
              tickets={recentTickets}
              isLoading={isLoading}
              emptyMessage="You haven't submitted any tickets yet."
            />
          </div>
        </div>

        {/* Quick Links / Help */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quick Help</h2>
          <Card className="space-y-6 border-none shadow-soft p-6">
            <div className="p-6 bg-secondary/50 rounded-xl border border-border/50">
              <h3 className="font-bold text-foreground text-sm">Need a fast answer?</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Check our Knowledge Base for quick solutions to common problems before submitting a ticket.
              </p>
              <Link to="/customer/kb">
                <Button variant="primary" size="sm" className="w-full mt-5">Browse Articles</Button>
              </Link>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Common Topics</h4>
              <ul className="space-y-3">
                {['Setting up your account', 'Billing and Invoices', 'Security settings'].map(item => (
                  <li key={item}>
                    <button className="text-sm text-foreground/80 hover:text-primary transition-colors flex items-center gap-2 group w-full text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
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
