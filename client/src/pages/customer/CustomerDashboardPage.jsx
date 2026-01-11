import React, { useEffect, useState } from 'react';
import { useTicketStore } from '@/store/ticketStore';
import CustomerDashboard from './CustomerDashboard';

const CustomerDashboardPage = () => {
  const { fetchTickets, tickets, isLoading } = useTicketStore();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    urgent: 0
  });

  useEffect(() => {
    fetchTickets({ limit: 10 });
  }, [fetchTickets]);

  useEffect(() => {
    // Generate simple stats from current tickets 
    // In a real app, these would come from a dedicated stats endpoint
    if (tickets) {
      setStats({
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length
      });
    }
  }, [tickets]);

  return (
    <CustomerDashboard 
      stats={stats}
      recentTickets={tickets.slice(0, 5)}
      isLoading={isLoading}
    />
  );
};

export default CustomerDashboardPage;
