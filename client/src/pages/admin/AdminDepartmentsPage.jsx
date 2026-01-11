import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users,
  UserCircle,
  MoreVertical 
} from 'lucide-react';
import { useDepartmentStore } from '@/store/departmentStore';
import { getUsers } from '@/services/userService';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useNotificationStore } from '@/store/notificationStore';

const AdminDepartmentsPage = () => {
  const { 
    departments, 
    isLoading, 
    fetchDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
  } = useDepartmentStore();
  
  const { addNotification } = useNotificationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, [fetchDepartments]);

  const fetchManagers = async () => {
    try {
      const response = await getUsers({ role: 'MANAGER', isActive: true });
      setManagers(response.data || response.users || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const filteredDepartments = departments?.filter(dept => 
    dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name || '',
        description: department.description || '',
        managerId: department.managerId || '',
        isActive: department.isActive ?? true
      });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', description: '', managerId: '', isActive: true });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '', managerId: '', isActive: true });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'Department name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, formData);
        addNotification({
          type: 'success',
          message: 'Department updated successfully',
          showToast: true
        });
      } else {
        await createDepartment(formData);
        addNotification({
          type: 'success',
          message: 'Department created successfully',
          showToast: true
        });
      }
      handleCloseModal();
      fetchDepartments();
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save department',
        showToast: true
      });
    }
  };

  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (departmentToDelete) {
      try {
        await deleteDepartment(departmentToDelete.id);
        addNotification({
          type: 'success',
          message: 'Department deleted successfully',
          showToast: true
        });
        fetchDepartments();
      } catch (error) {
        addNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to delete department',
          showToast: true
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setDepartmentToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Organize your support team into departments.
          </p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Add Department
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search departments..."
          onClear={() => setSearchQuery('')}
        />
      </Card>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description={searchQuery ? 'Try adjusting your search query.' : 'Create your first department to get started.'}
          action={
            !searchQuery && (
              <Button icon={Plus} onClick={() => handleOpenModal()}>
                Create Department
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <Card key={department.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${department.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'} dark:bg-slate-800`}>
                  <Building2 size={24} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(department)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(department)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                {department.name}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                {department.description || 'No description provided'}
              </p>
              
              {department.manager && (
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-400">
                  <UserCircle size={16} />
                  <span>Manager: {department.manager.firstName} {department.manager.lastName}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={16} />
                  <span>{department._count?.users || department.agentCount || 0} agents</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  department.isActive 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Technical Support"
            error={formErrors.name}
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the department's responsibilities..."
            rows={3}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department Manager
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">No manager assigned</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName} ({manager.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Assign a manager to oversee this department
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
              Department is active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingDepartment ? 'Update' : 'Create'} Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? All agents in this department will need to be reassigned.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AdminDepartmentsPage;
