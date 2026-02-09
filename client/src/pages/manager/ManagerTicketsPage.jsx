import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  Filter,
  Eye,
  UserPlus,
  RefreshCw,
  Users
} from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import { useAuthStore } from '@/store/authStore';
import * as userService from '@/services/userService';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';
import { useNotificationStore } from '@/store/notificationStore';
import { format } from 'date-fns';

const ManagerTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const {
    tickets,
    isLoading,
    pagination,
    filters,
    fetchTickets,
    setFilters,
    setPage,
    assignTicket
  } = useTicketStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  useEffect(() => {
    // Fetch department tickets
    fetchTickets({ departmentId: user?.departmentId });
  }, [fetchTickets, filters, pagination.page, user?.departmentId]);

  useEffect(() => {
    // Fetch agents in the department
    const fetchAgents = async () => {
      try {
        const response = await userService.getAgents(user?.departmentId);
        setAgents(response.data || response || []);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };
    if (user?.departmentId) {
      fetchAgents();
    }
  }, [user?.departmentId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchQuery });
  };

  const handleStatusFilter = (status) => {
    setFilters({ status });
  };

  const handleViewTicket = (ticketId) => {
    navigate(`/manager/tickets/${ticketId}`);
  };

  const handleOpenAssignModal = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedAgentId(ticket.assigneeId || '');
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedTicket || !selectedAgentId) return;

    try {
      await assignTicket(selectedTicket.id, selectedAgentId);
      addNotification({
        type: 'success',
        message: 'Ticket assigned successfully',
        showToast: true
      });
      setAssignModalOpen(false);
      fetchTickets({ departmentId: user?.departmentId });
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign ticket',
        showToast: true
      });
    }
  };

  const handleRefresh = () => {
    fetchTickets({ departmentId: user?.departmentId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Tickets</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage and assign tickets in your department.
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
              placeholder="Search tickets..."
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
              value={filters.assigneeId}
              onChange={(e) => setFilters({ assigneeId: e.target.value })}
              options={[
                { value: '', label: 'All Agents' },
                { value: 'unassigned', label: 'Unassigned' },
                ...agents.map(a => ({
                  value: a.id,
                  label: `${a.firstName} ${a.lastName}`
                }))
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
            description="There are no tickets in your department matching your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
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
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {ticket.customerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {ticket.assigneeName || (
                          <span className="text-amber-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
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
                            onClick={() => handleOpenAssignModal(ticket)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Assign Agent"
                          >
                            <UserPlus size={16} />
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

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Ticket"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Assign <strong>{selectedTicket?.title || selectedTicket?.subject}</strong> to an agent.
          </p>

          <Select
            label="Select Agent"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            options={[
              { value: '', label: 'Select an agent...' },
              ...agents.map(a => ({
                value: a.id,
                label: `${a.firstName} ${a.lastName}`
              }))
            ]}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedAgentId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerTicketsPage;
