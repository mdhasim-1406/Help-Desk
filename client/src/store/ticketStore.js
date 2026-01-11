import { create } from 'zustand';
import * as ticketService from '@/services/ticketService';

const useTicketStore = create((set, get) => ({
  // State
  tickets: [],
  ticket: null,
  messages: [],
  stats: { total: 0, open: 0, resolved: 0, avgResponse: '0h' },
  filters: {
    status: '',
    priority: '',
    assigneeId: '',
    departmentId: '',
    search: '',
  },
  pagination: {
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  // Actions
  setTickets: (tickets, pagination) => set({
    tickets,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.perPage),
    },
  }),

  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),

  updateTicketInList: (ticket) => set((state) => ({
    tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t),
  })),

  removeTicketFromList: (id) => set((state) => ({
    tickets: state.tickets.filter(t => t.id !== id),
  })),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
    pagination: { ...state.pagination, page: 1 },
  })),

  resetFilters: () => set({
    filters: {
      status: '',
      priority: '',
      assigneeId: '',
      departmentId: '',
      search: '',
    },
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
    },
  }),

  setPage: (page) => set((state) => ({
    pagination: { ...state.pagination, page },
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Async Methods
  fetchTickets: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { data, pagination } = await ticketService.getTickets({
        ...get().filters,
        ...filters,
        page: filters?.page || get().pagination.page,
        limit: filters?.perPage || get().pagination.perPage,
      });

      // Map backend data to frontend model if necessary
      const mappedTickets = data.map(t => ({
        ...t,
        title: t.title || t.subject, // Use title directly, fallback to subject for compatibility
        status: typeof t.status === 'object' ? t.status : { name: t.status, displayName: t.status },
        statusDisplayName: t.status?.displayName || t.status,
        statusColor: t.status?.color,
        customerName: t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : 'N/A',
        assigneeName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
      }));

      set({
        tickets: mappedTickets,
        pagination: {
          page: pagination.page,
          perPage: pagination.limit,
          total: pagination.total,
          totalPages: pagination.pages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  fetchTicketById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ticketService.getTicketById(id);

      const mappedTicket = {
        ...data,
        title: data.title || data.subject,
        status: typeof data.status === 'object' ? data.status : { name: data.status, displayName: data.status },
        statusDisplayName: data.status?.displayName || data.status,
        statusColor: data.status?.color,
        customerName: data.customer ? `${data.customer.firstName} ${data.customer.lastName}` : 'N/A',
        assigneeName: data.assignedTo ? `${data.assignedTo.firstName} ${data.assignedTo.lastName}` : 'Unassigned',
      };

      set({ ticket: mappedTicket, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  fetchTicketMessages: async (id) => {
    try {
      const { data } = await ticketService.getMessages(id);
      set({ messages: data });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
    }
  },

  addMessage: async (id, data) => {
    try {
      const { content, isInternal } = typeof data === 'string' ? { content: data, isInternal: false } : data;
      const { data: newMessage } = await ticketService.addMessage(id, content, isInternal);
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
      return newMessage;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  updateTicketStatus: async (id, status) => {
    try {
      const { data: updatedTicket } = await ticketService.updateTicket(id, { status: status.toUpperCase() });
      const mappedTicket = {
        ...updatedTicket,
        title: updatedTicket.subject,
        status: updatedTicket.status.name.toLowerCase(),
      };

      set((state) => ({
        ticket: state.ticket?.id === id ? mappedTicket : state.ticket,
        tickets: state.tickets.map(t => t.id === id ? mappedTicket : t)
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  updateTicketPriority: async (id, priority) => {
    try {
      const { data: updatedTicket } = await ticketService.updateTicket(id, { priority });
      const mappedTicket = {
        ...updatedTicket,
        title: updatedTicket.subject,
        status: updatedTicket.status.name.toLowerCase(),
      };

      set((state) => ({
        ticket: state.ticket?.id === id ? mappedTicket : state.ticket,
        tickets: state.tickets.map(t => t.id === id ? mappedTicket : t)
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  createTicket: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        title: data.subject || data.title,
        description: data.description,
        priority: data.priority?.toUpperCase() || 'MEDIUM',
        departmentId: data.departmentId,
      };

      const { data: newTicket } = await ticketService.createTicket(payload);
      set({ isLoading: false });
      return newTicket;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      throw error;
    }
  },
}));

export { useTicketStore };
export default useTicketStore;
