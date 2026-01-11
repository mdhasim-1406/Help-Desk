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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administration Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">High-level metrics and system management.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={ShieldCheck}>System Status</Button>
          <Button size="sm" icon={UserPlus} onClick={() => navigate('/admin/users')}>Add Agent</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-5 border-none shadow-sm dark:bg-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                {statsLoading ? (
                  <div className="mt-2"><Spinner size="sm" /></div>
                ) : (
                  <h3 className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</h3>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent System Activity</h2>
            <Button variant="ghost" size="sm" className="text-xs group" onClick={() => navigate('/admin/tickets')}>
              View All Logs <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Agent</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {ticket.title || 'Untitled Ticket'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            #{ticket.ticketNumber || ticket.id?.substring(0, 8) || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <TicketStatusBadge status={ticket.status || 'unknown'} />
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {ticket.customer?.firstName && ticket.customer?.lastName 
                            ? `${ticket.customer.firstName} ${ticket.customer.lastName}` 
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {ticket.assignedTo?.firstName ? (
                            <div className="flex items-center gap-2">
                               <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                                 {ticket.assignedTo.firstName[0]}
                               </div>
                               <span>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName || ''}</span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs">
                          {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!isLoading && (!tickets || tickets.length === 0) && (
              <div className="p-12 text-center text-slate-400">
                No tickets recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Performance */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Agent Performance</h3>
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
              ) : agentPerformance.length > 0 ? (
                agentPerformance.map((agent, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">{agent.name}</span>
                        <span className="text-slate-500">{agent.resolved} resolved</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${agent.color}`} 
                          style={{ width: `${Math.min(agent.score, 100)}%` }} 
                        />
                     </div>
                     <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Resolution Rate: {agent.score}%</span>
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-4">No agent data available</div>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => navigate('/admin/reports')}>
              View Analytics
            </Button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
             <BarChart3 className="absolute bottom-[-10px] right-[-10px] h-32 w-32 text-white/5" />
             <h3 className="font-bold mb-1">Queue Health</h3>
             <p className="text-xs text-slate-400 mb-4">
               {dashboardStats.activeTickets > 0 
                 ? `You have ${dashboardStats.activeTickets} active tickets to review.`
                 : 'All queues are clear!'}
             </p>
             <div className="flex gap-2">
                <Button variant="danger" size="sm" className="flex-1" onClick={() => navigate('/admin/tickets')}>
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
