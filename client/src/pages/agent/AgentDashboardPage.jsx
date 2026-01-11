import React, { useEffect } from 'react';
import AgentDashboard from './AgentDashboard';
import TicketList from '@/components/tickets/TicketList';
import { useTicketStore } from '@/store/ticketStore';

const AgentDashboardPage = () => {
  const { fetchTickets, tickets, stats, isLoading } = useTicketStore();

  useEffect(() => {
    // Fetch tickets assigned to current agent
    fetchTickets({ assignedToMe: true, limit: 10 });
    // In a real app, we'd have a specific stats endpoint
  }, [fetchTickets]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agent Workspace</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome back. Here is what needs your attention today.</p>
      </div>

      <AgentDashboard stats={stats || { total: tickets.length, open: tickets.filter(t => t.status === 'open').length }} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Assigned Tickets</h2>
        </div>
        <TicketList 
          tickets={tickets.slice(0, 5)} 
          isLoading={isLoading} 
          emptyMessage="You have no tickets assigned to you at the moment."
        />
      </section>
    </div>
  );
};

export default AgentDashboardPage;
