import React from 'react';
import { cn } from '@/utils/helpers';
import TicketCard from './TicketCard';
import EmptyState from '../common/EmptyState';
import Spinner from '../common/Spinner';

const TicketList = ({
  tickets = [],
  isLoading = false,
  emptyMessage = "No tickets found matching your criteria.",
  className = "",
  onAIAction
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        className="py-16"
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} onAIAction={onAIAction} />
      ))}
    </div>
  );
};

export default TicketList;
