import api from './api';

/**
 * Get all departments
 */
export async function getDepartments() {
  const response = await api.get('/departments');
  return response.data;
}

/**
 * Get department by ID
 */
export async function getDepartmentById(id) {
  const response = await api.get(`/departments/${id}`);
  return response.data;
}

/**
 * Create new department
 */
export async function createDepartment(data) {
  const response = await api.post('/departments', data);
  return response.data;
}

/**
 * Update department
 */
export async function updateDepartment(id, data) {
  const response = await api.put(`/departments/${id}`, data);
  return response.data;
}

/**
 * Delete department
 */
export async function deleteDepartment(id) {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
}

/**
 * Get agents in department
 */
export async function getDepartmentAgents(id) {
  const response = await api.get(`/departments/${id}/agents`);
  return response.data;
}

const departmentService = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentAgents,
};

export default departmentService;
