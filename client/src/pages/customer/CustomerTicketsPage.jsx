import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search, RotateCcw } from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import TicketList from '@/components/tickets/TicketList';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';

const CustomerTicketsPage = () => {
  const { fetchTickets, tickets, pagination, isLoading } = useTicketStore();
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1
  });

  useEffect(() => {
    fetchTickets(filters);
  }, [fetchTickets, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: '',
      page: 1
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Support Tickets</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all your submitted requests in one place.</p>
        </div>
        <Link to="/customer/tickets/new">
          <Button icon={Plus}>New Ticket</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full lg:w-auto">
          <SearchInput
            label="Search Tickets"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onClear={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
            placeholder="Search by title or ID..."
          />
        </div>

        <div className="w-full lg:w-48">
          <Select
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' }
            ]}
          />
        </div>

        <div className="w-full lg:w-48">
          <Select
            label="Priority"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
        </div>

        <Button 
          variant="ghost" 
          onClick={resetFilters}
          className="h-10 lg:mb-0"
          icon={RotateCcw}
        >
          Reset
        </Button>
      </div>

      {/* List */}
      <div className="space-y-6">
        <TicketList 
          tickets={tickets} 
          isLoading={isLoading} 
          emptyMessage={
            filters.search || filters.status || filters.priority
              ? "No tickets match your filter criteria."
              : "You haven't submitted any tickets yet."
          }
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTicketsPage;
