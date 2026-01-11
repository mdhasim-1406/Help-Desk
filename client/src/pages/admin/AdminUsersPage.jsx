import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, MoreVertical, Shield, Trash2, Edit2, Filter, Eye, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import Toggle from '@/components/common/Toggle';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/userService';
import { getDepartments } from '@/services/departmentService';
import { useUIStore } from '@/store/uiStore';
import { debounce } from '@/utils/helpers';

const AdminUsersPage = () => {
  // State
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([
    { id: 'role-admin', name: 'ADMIN', displayName: 'Admin' },
    { id: 'role-manager', name: 'MANAGER', displayName: 'Manager' },
    { id: 'role-agent', name: 'AGENT', displayName: 'Agent' },
    { id: 'role-customer', name: 'CUSTOMER', displayName: 'Customer' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    userId: null,
    userName: ''
  });
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    roleId: '',
    departmentId: '',
    isActive: true
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const { addToast } = useUIStore();

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(departmentFilter && { departmentId: departmentFilter })
      };
      
      const response = await getUsers(params);
      setUsers(response.data || response.users || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || response.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!editingUser && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    if ((formData.role === 'AGENT' || formData.role === 'MANAGER') && !formData.departmentId) {
      errors.departmentId = 'Department is required for agents and managers';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle create user
  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'CUSTOMER',
      roleId: '',
      departmentId: '',
      isActive: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      role: user.role?.name || 'CUSTOMER',
      roleId: user.roleId || user.role?.id || '',
      departmentId: user.departmentId || '',
      isActive: user.isActive !== false
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find the roleId from role name
      const selectedRole = roles.find(r => r.name === formData.role);
      
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        roleId: selectedRole?.id || formData.roleId,
        isActive: formData.isActive
      };
      
      // Add password only if provided
      if (formData.password) {
        payload.password = formData.password;
      }
      
      // Add department only for agents and managers
      if (formData.role === 'AGENT' || formData.role === 'MANAGER') {
        payload.departmentId = formData.departmentId;
      }
      
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        addToast({
          type: 'success',
          message: 'User updated successfully'
        });
      } else {
        await createUser(payload);
        addToast({
          type: 'success',
          message: 'User created successfully'
        });
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save user';
      addToast({
        type: 'error',
        message: errorMessage
      });
      console.error('Error saving user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = (user) => {
    setConfirmDialog({
      isOpen: true,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(confirmDialog.userId);
      addToast({
        type: 'success',
        message: 'User deactivated successfully'
      });
      setConfirmDialog({ isOpen: false, userId: null, userName: '' });
      fetchUsers();
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to deactivate user'
      });
      console.error('Error deleting user:', err);
    }
  };

  // Get user initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      AGENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      CUSTOMER: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300',
    };
    return colors[role] || colors.CUSTOMER;
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
      : 'text-slate-600 bg-slate-100 dark:bg-slate-800';
  };

  // Handle retry
  const handleRetry = () => {
    fetchUsers();
  };

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error && users.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={handleRetry}
      />
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage system users and their access levels.</p>
        </div>
        <Button icon={Plus} onClick={handleCreateUser}>Add User</Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full lg:w-auto">
          <SearchInput
            label="Search Users"
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search by name or email..."
            onClear={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-full lg:w-48">
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'AGENT', label: 'Agent' },
              { value: 'CUSTOMER', label: 'Customer' }
            ]}
          />
        </div>
        <div className="w-full lg:w-48">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
          />
        </div>
        <div className="w-full lg:w-48">
          <Select
            label="Department"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map(dept => ({
                value: dept.id,
                label: dept.name
              }))
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          message="Try adjusting your filters or create a new user."
          action={{
            label: 'Add User',
            onClick: handleCreateUser
          }}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <span className="font-bold">{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role?.name || user.role)}`}>
                          {user.role?.displayName || user.role?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {user.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" 
                            title="Edit"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit2 size={14} className="text-slate-500" />
                          </button>
                          <button 
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                            title="Deactivate"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Add/Edit User Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg"
        closeOnOverlayClick={!isSubmitting}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              required
              disabled={isSubmitting}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              required
              disabled={isSubmitting}
              placeholder="Enter last name"
            />
          </div>
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            required
            disabled={isSubmitting || editingUser}
            placeholder="user@example.com"
            helperText={editingUser ? "Email cannot be changed" : ""}
          />
          
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            required={!editingUser}
            disabled={isSubmitting}
            placeholder={editingUser ? "Leave blank to keep current password" : "Min 8 characters"}
            helperText={editingUser ? "Leave blank to keep current password" : "Minimum 8 characters"}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              {formErrors.role && (
                <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>
            
            {(formData.role === 'AGENT' || formData.role === 'MANAGER') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {formErrors.departmentId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.departmentId}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Status
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                User can login and access the system
              </p>
            </div>
            <Toggle
              checked={formData.isActive}
              onChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmDelete}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmDialog.userName}?\n\nThey will no longer be able to login to the system.`}
        type="danger"
        confirmText="Deactivate"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminUsersPage;
