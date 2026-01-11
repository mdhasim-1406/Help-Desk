import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  UserPlus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import { Card } from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { format } from 'date-fns';

const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const { 
    tickets, 
    isLoading, 
    pagination,
    filters,
    fetchTickets, 
    setFilters,
    setPage,
    deleteTicket 
  } = useTicketStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, filters, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchQuery });
  };

  const handleStatusFilter = (status) => {
    setFilters({ status });
  };

  const handlePriorityFilter = (priority) => {
    setFilters({ priority });
  };

  const handleViewTicket = (ticketId) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ticketToDelete) {
      await deleteTicket(ticketToDelete.id);
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Tickets</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage and monitor all support tickets across the system.
          </p>
        </div>
        <Button icon={RefreshCw} variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets by subject, ID..."
              onClear={() => {
                setSearchQuery('');
                setFilters({ search: '' });
              }}
            />
          </div>
          <div className="w-full lg:w-40">
            <Select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'WAITING_CUSTOMER', label: 'Waiting' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
          </div>
          <div className="w-full lg:w-40">
            <Select
              value={filters.priority}
              onChange={(e) => handlePriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Priority' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </div>
        </form>
      </Card>

      {/* Tickets Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets found"
            description="There are no tickets matching your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[250px]">
                            {ticket.title || ticket.subject}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            #{ticket.id?.substring(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4">
                        <TicketPriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {ticket.customerName || ticket.customer?.firstName + ' ' + ticket.customer?.lastName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {ticket.assigneeName || ticket.assignedTo?.firstName + ' ' + ticket.assignedTo?.lastName || (
                          <span className="text-amber-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewTicket(ticket.id)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Ticket"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(ticket)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Ticket"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket "${ticketToDelete?.title || ticketToDelete?.subject}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AdminTicketsPage;
