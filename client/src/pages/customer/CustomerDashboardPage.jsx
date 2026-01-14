import React, { useEffect, useMemo } from 'react';
import { useTicketStore } from '@/store/ticketStore';
import CustomerDashboard from './CustomerDashboard';

const CustomerDashboardPage = () => {
  const { fetchTickets, tickets, isLoading } = useTicketStore();

  useEffect(() => {
    fetchTickets({ limit: 10 });
  }, [fetchTickets]);

  // Derive stats from tickets using useMemo instead of setState in useEffect
  const stats = useMemo(() => {
    if (!tickets) {
      return { total: 0, pending: 0, resolved: 0, urgent: 0 };
    }
    return {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
      resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    };
  }, [tickets]);

  return (
    <CustomerDashboard
      stats={stats}
      recentTickets={tickets?.slice(0, 5) || []}
      isLoading={isLoading}
    />
  );
};

export default CustomerDashboardPage;
