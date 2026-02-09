import React, { useEffect, useState } from 'react';
import { useTicketStore } from '@/store/ticketStore';
import {
  Filter,
  Search,
  RotateCcw,
  LayoutGrid,
  List as ListIcon,
  Download
} from 'lucide-react';
import TicketList from '@/components/tickets/TicketList';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import Tabs from '@/components/common/Tabs';
import AIToolsModal from '@/components/tickets/AIToolsModal';

const AgentTicketQueuePage = () => {
  const { fetchTickets, tickets, pagination, isLoading } = useTicketStore();
  const [view, setView] = useState('list'); // list or card

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    assignedTo: 'me', // 'me', 'unassigned', 'all'
    page: 1
  });

  const [aiTicket, setAiTicket] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets(filters);
  }, [fetchTickets, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const tabs = [
    { id: 'me', label: 'My Tickets' },
    { id: 'unassigned', label: 'Unassigned' },
    { id: 'all', label: 'All Tickets' }
  ];

  const handleAIAction = (ticket) => {
    setAiTicket(ticket);
    setIsAIModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ticket Queue</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and respond to support requests from customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={Download} size="sm">Export</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 inline-flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilters(prev => ({ ...prev, assignedTo: tab.id, page: 1 }))}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filters.assignedTo === tab.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by ID, title, or customer name..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onClear={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-40">
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              options={[
                { value: '', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'pending', label: 'Pending' },
                { value: 'resolved', label: 'Resolved' }
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              options={[
                { value: '', label: 'All Priority' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setFilters({ ...filters, status: '', priority: '', search: '', page: 1 })}
            icon={RotateCcw}
          />
        </div>
      </div>

      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        emptyMessage="No tickets found matching your criteria."
        onAIAction={handleAIAction}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          />
        </div>
      )}

      <AIToolsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        ticket={aiTicket}
      />
    </div>
  );
};

export default AgentTicketQueuePage;
