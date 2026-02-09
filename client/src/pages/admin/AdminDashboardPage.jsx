import React, { useEffect, useState } from 'react';
import {
  Users,
  Ticket,
  Clock,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/store/ticketStore';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import { format } from 'date-fns';
import * as reportService from '@/services/reportService';
import { getUsers } from '@/services/userService';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { fetchTickets, tickets, isLoading: ticketsLoading } = useTicketStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    userCount: 0,
    activeTickets: 0,
    avgSolveTime: 'N/A',
    slaBreaches: 0
  });
  const [agentPerformance, setAgentPerformance] = useState([]);

  useEffect(() => {
    fetchTickets({ limit: 10 });
    fetchDashboardData();
  }, [fetchTickets]);

  const fetchDashboardData = async () => {
    setStatsLoading(true);
    try {
      const [usersRes, summaryRes, agentRes] = await Promise.all([
        getUsers({ limit: 1000 }),
        reportService.getTicketSummary().catch(() => ({ data: {} })),
        reportService.getTicketsByAgent().catch(() => ({ data: [] }))
      ]);

      const users = usersRes.data || usersRes.users || [];
      const summary = summaryRes.data || summaryRes || {};
      const agents = agentRes.data || agentRes || [];

      setDashboardStats({
        userCount: users.length,
        activeTickets: summary.open || summary.total || 0,
        avgSolveTime: summary.avgResolutionTime || 'N/A',
        slaBreaches: summary.slaBreaches || 0
      });

      const formattedAgents = agents.slice(0, 4).map((agent, idx) => ({
        name: agent.name || `Agent ${idx + 1}`,
        resolved: agent.resolvedTickets || agent.resolved || 0,
        score: parseInt(agent.resolutionRate) || 0,
        color: ['bg-emerald-500', 'bg-primary-500', 'bg-blue-500', 'bg-amber-500'][idx]
      }));

      setAgentPerformance(formattedAgents);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const stats = [
    { label: 'Users', value: dashboardStats.userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Active Tickets', value: dashboardStats.activeTickets, icon: Ticket, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Avg Solved Time', value: dashboardStats.avgSolveTime, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'SLA Breaches', value: dashboardStats.slaBreaches, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  const isLoading = ticketsLoading || statsLoading;

  return (
    <div className="space-y-8 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Administration Overview</h1>
          <p className="text-muted-foreground mt-1">High-level metrics and system management.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" icon={ShieldCheck}>System Status</Button>
          <Button size="sm" icon={UserPlus} onClick={() => navigate('/admin/users')}>Add Agent</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 border-none shadow-soft hover:shadow-medium transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{stat.label}</p>
                {statsLoading ? (
                  <div className="mt-2"><Spinner size="sm" /></div>
                ) : (
                  <h3 className="text-3xl font-bold mt-2 text-foreground tracking-tight">{stat.value}</h3>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors ${stat.color}`}>
                <stat.icon size={22} className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recent System Activity</h2>
            <Button variant="ghost" size="sm" className="text-xs group hover:bg-transparent hover:text-primary" onClick={() => navigate('/admin/tickets')}>
              View All Logs <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ticket</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Agent</th>
                    <th className="px-6 py-4 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Spinner size="md" />
                      </td>
                    </tr>
                  ) : (tickets || []).slice(0, 6).map((ticket) => {
                    if (!ticket || !ticket.id) return null;
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors">
                            {ticket.title || 'Untitled Ticket'}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            #{ticket.ticketNumber || ticket.id?.substring(0, 8) || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <TicketStatusBadge status={ticket.status || 'unknown'} />
                        </td>
                        <td className="px-6 py-5 text-foreground/80">
                          {ticket.customer?.firstName && ticket.customer?.lastName
                            ? `${ticket.customer.firstName} ${ticket.customer.lastName}`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-5 text-foreground/80">
                          {ticket.assignedTo?.firstName ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground">
                                {ticket.assignedTo.firstName[0]}
                              </div>
                              <span>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName || ''}</span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right text-muted-foreground text-xs font-medium">
                          {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!isLoading && (!tickets || tickets.length === 0) && (
              <div className="p-12 text-center text-muted-foreground">
                No tickets recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Performance */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Agent Performance</h3>
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
              ) : agentPerformance.length > 0 ? (
                agentPerformance.map((agent, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-foreground">{agent.name}</span>
                      <span className="text-muted-foreground text-xs">{agent.resolved} resolved</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${agent.color}`}
                        style={{ width: `${Math.min(agent.score, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Resolution Rate: {agent.score}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4 text-sm">No agent data available</div>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-8" onClick={() => navigate('/admin/reports')}>
              View Analytics
            </Button>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg shadow-primary/20">
            <BarChart3 className="absolute bottom-[-10px] right-[-10px] h-32 w-32 text-white/10" />
            <h3 className="font-bold mb-1 text-lg">Queue Health</h3>
            <p className="text-xs text-primary-100 mb-6 leading-relaxed opacity-90">
              {dashboardStats.activeTickets > 0
                ? `You have ${dashboardStats.activeTickets} active tickets needing attention.`
                : 'All queues are clear! Great job.'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm" onClick={() => navigate('/admin/tickets')}>
                Audit Queue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
