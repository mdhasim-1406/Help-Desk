import api from './api';
import { generateQueryString } from '@/utils/helpers';

/**
 * Get all SLA policies
 */
export async function getSLAPolicies() {
  const response = await api.get('/sla');
  return response.data;
}

/**
 * Get SLA policy by ID
 */
export async function getSLAPolicyById(id) {
  const response = await api.get(`/sla/${id}`);
  return response.data;
}

/**
 * Create new SLA policy
 */
export async function createSLAPolicy(data) {
  const response = await api.post('/sla', data);
  return response.data;
}

/**
 * Update SLA policy
 */
export async function updateSLAPolicy(id, data) {
  const response = await api.put(`/sla/${id}`, data);
  return response.data;
}

/**
 * Delete SLA policy
 */
export async function deleteSLAPolicy(id) {
  const response = await api.delete(`/sla/${id}`);
  return response.data;
}

/**
 * Get SLA breaches
 */
export async function getSLABreaches(params = {}) {
  const queryString = generateQueryString(params);
  const response = await api.get(`/sla/breaches${queryString}`);
  return response.data;
}

const slaService = {
  getSLAPolicies,
  getSLAPolicyById,
  createSLAPolicy,
  updateSLAPolicy,
  deleteSLAPolicy,
  getSLABreaches,
};

export default slaService;
