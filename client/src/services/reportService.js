import api from './api';
import { generateQueryString } from '@/utils/helpers';

/**
 * Get ticket summary statistics
 */
export async function getTicketSummary(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/tickets/summary${queryString}`);
  return response.data;
}

/**
 * Get tickets grouped by status
 */
export async function getTicketsByStatus(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/tickets/by-status${queryString}`);
  return response.data;
}

/**
 * Get tickets grouped by priority
 */
export async function getTicketsByPriority(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/tickets/by-priority${queryString}`);
  return response.data;
}

/**
 * Get tickets per agent
 */
export async function getTicketsByAgent(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/tickets/by-agent${queryString}`);
  return response.data;
}

/**
 * Get tickets per department
 */
export async function getTicketsByDepartment(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/tickets/by-department${queryString}`);
  return response.data;
}

/**
 * Get SLA compliance metrics
 */
export async function getSLACompliance(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/sla/compliance${queryString}`);
  return response.data;
}

/**
 * Get resolution time metrics
 */
export async function getResolutionTime(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/resolution-time${queryString}`);
  return response.data;
}

/**
 * Get ticket volume over time
 */
export async function getTicketVolume(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/volume${queryString}`);
  return response.data;
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/reports/agent-performance${queryString}`);
  return response.data;
}

const reportService = {
  getTicketSummary,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByAgent,
  getTicketsByDepartment,
  getSLACompliance,
  getResolutionTime,
  getTicketVolume,
  getAgentPerformance,
};

export default reportService;
