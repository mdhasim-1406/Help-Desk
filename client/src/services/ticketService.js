import api from './api';
import { generateQueryString } from '@/utils/helpers';

/**
 * Get tickets with filters
 */
export async function getTickets(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/tickets${queryString}`);
  return response.data;
}

/**
 * Get ticket by ID
 */
export async function getTicketById(id) {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
}

/**
 * Create new ticket
 */
export async function createTicket(data) {
  const response = await api.post('/tickets', data);
  return response.data;
}

/**
 * Update ticket
 */
export async function updateTicket(id, data) {
  const response = await api.put(`/tickets/${id}`, data);
  return response.data;
}

/**
 * Delete ticket
 */
export async function deleteTicket(id) {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
}

/**
 * Assign ticket to agent
 */
export async function assignTicket(id, agentId) {
  const response = await api.post(`/tickets/${id}/assign`, { agentId });
  return response.data;
}

/**
 * Reassign ticket to different agent
 */
export async function reassignTicket(id, agentId, reason) {
  const response = await api.post(`/tickets/${id}/reassign`, {
    agentId,
    reason,
  });
  return response.data;
}

/**
 * Agent claims unassigned ticket
 */
export async function claimTicket(id) {
  const response = await api.post(`/tickets/${id}/claim`);
  return response.data;
}

/**
 * Escalate ticket
 */
export async function escalateTicket(id, reason) {
  const response = await api.post(`/tickets/${id}/escalate`, { reason });
  return response.data;
}

/**
 * Close ticket
 */
export async function closeTicket(id, resolution) {
  const response = await api.post(`/tickets/${id}/close`, { resolution });
  return response.data;
}

/**
 * Reopen closed ticket
 */
export async function reopenTicket(id, reason) {
  const response = await api.post(`/tickets/${id}/reopen`, { reason });
  return response.data;
}

/**
 * Get ticket messages
 */
export async function getMessages(ticketId) {
  const response = await api.get(`/tickets/${ticketId}/messages`);
  return response.data;
}

/**
 * Add message to ticket
 */
export async function addMessage(ticketId, content, isInternal = false) {
  const response = await api.post(`/tickets/${ticketId}/messages`, {
    content,
    isInternal,
  });
  return response.data;
}

/**
 * Get ticket history
 */
export async function getTicketHistory(ticketId) {
  const response = await api.get(`/tickets/${ticketId}/history`);
  return response.data;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/tickets/stats${queryString}`);
  return response.data;
}

const ticketService = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  reassignTicket,
  claimTicket,
  escalateTicket,
  closeTicket,
  reopenTicket,
  getMessages,
  addMessage,
  getTicketHistory,
  getTicketStats,
};

export default ticketService;
