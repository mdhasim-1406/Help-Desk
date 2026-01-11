import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import * as slaService from '@/services/slaService';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Textarea from '@/components/common/Textarea';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useNotificationStore } from '@/store/notificationStore';

const AdminSLAPage = () => {
  const { addNotification } = useNotificationStore();
  
  const [policies, setPolicies] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBreaches, setIsLoadingBreaches] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM',
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await slaService.getSLAPolicies();
      setPolicies(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch SLA policies:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load SLA policies',
        showToast: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBreaches = async () => {
    setIsLoadingBreaches(true);
    try {
      const response = await slaService.getSLABreaches({ status: 'OPEN' });
      setBreaches(response.data || response.breaches || []);
    } catch (error) {
      console.error('Failed to fetch SLA breaches:', error);
    } finally {
      setIsLoadingBreaches(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchBreaches();
  }, []);

  const handleOpenModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        name: policy.name || '',
        description: policy.description || '',
        priority: policy.priority || 'MEDIUM',
        responseTimeHours: policy.responseTimeHours || 4,
        resolutionTimeHours: policy.resolutionTimeHours || 24,
        isActive: policy.isActive ?? true
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        name: '',
        description: '',
        priority: 'MEDIUM',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        isActive: true
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'Policy name is required';
    }
    if (formData.responseTimeHours < 1) {
      errors.responseTimeHours = 'Response time must be at least 1 hour';
    }
    if (formData.resolutionTimeHours < 1) {
      errors.resolutionTimeHours = 'Resolution time must be at least 1 hour';
    }
    if (formData.resolutionTimeHours <= formData.responseTimeHours) {
      errors.resolutionTimeHours = 'Resolution time must be greater than response time';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingPolicy) {
        await slaService.updateSLAPolicy(editingPolicy.id, formData);
        addNotification({
          type: 'success',
          message: 'SLA policy updated successfully',
          showToast: true
        });
      } else {
        await slaService.createSLAPolicy(formData);
        addNotification({
          type: 'success',
          message: 'SLA policy created successfully',
          showToast: true
        });
      }
      handleCloseModal();
      fetchPolicies();
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save SLA policy',
        showToast: true
      });
    }
  };

  const handleDeleteClick = (policy) => {
    setPolicyToDelete(policy);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (policyToDelete) {
      try {
        await slaService.deleteSLAPolicy(policyToDelete.id);
        addNotification({
          type: 'success',
          message: 'SLA policy deleted successfully',
          showToast: true
        });
        fetchPolicies();
      } catch (error) {
        addNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to delete SLA policy',
          showToast: true
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setPolicyToDelete(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SLA Policy Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure service level agreements for different ticket priorities.
          </p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Add SLA Policy
        </Button>
      </div>

      {/* SLA Breach Dashboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active SLA Breaches</h2>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {breaches.length} {breaches.length === 1 ? 'breach' : 'breaches'}
          </span>
        </div>

        {isLoadingBreaches ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : breaches.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={48} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No active SLA breaches - All tickets are within SLA targets!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="pb-3">Ticket #</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Breach Type</th>
                  <th className="pb-3">Overdue By</th>
                  <th className="pb-3">Assignee</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {breaches.map((breach) => (
                  <tr key={breach.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono text-primary-600">{breach.ticket?.ticketNumber}</td>
                    <td className="py-3 max-w-xs truncate">{breach.ticket?.subject}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {breach.type === 'RESPONSE' ? 'First Response' : 'Resolution'}
                      </span>
                    </td>
                    <td className="py-3 text-red-600 dark:text-red-400 font-medium">
                      {breach.overdueHours}h
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {breach.ticket?.assignee ? 
                        `${breach.ticket.assignee.firstName} ${breach.ticket.assignee.lastName}` : 
                        'Unassigned'
                      }
                    </td>
                    <td className="py-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/tickets/${breach.ticket?.id}`}
                      >
                        View Ticket
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SLA Policies */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No SLA policies configured"
          description="Create SLA policies to define response and resolution time targets."
          action={
            <Button icon={Plus} onClick={() => handleOpenModal()}>
              Create SLA Policy
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy) => (
            <Card key={policy.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${policy.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'} dark:bg-slate-800`}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {policy.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(policy.priority)}`}>
                      {policy.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(policy)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(policy)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {policy.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {policy.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Response Time</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {policy.responseTimeHours}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Resolution Time</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {policy.resolutionTimeHours}h
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {policy.isActive ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle size={14} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <XCircle size={14} />
                    Inactive
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit SLA Policy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPolicy ? 'Edit SLA Policy' : 'Add SLA Policy'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Policy Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Standard Response"
            error={formErrors.name}
            required
          />

          <Select
            label="Priority Level"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this SLA policy..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Response Time (hours)"
              type="number"
              min="1"
              value={formData.responseTimeHours}
              onChange={(e) => setFormData({ ...formData, responseTimeHours: parseInt(e.target.value) || 1 })}
              error={formErrors.responseTimeHours}
              required
            />
            <Input
              label="Resolution Time (hours)"
              type="number"
              min="1"
              value={formData.resolutionTimeHours}
              onChange={(e) => setFormData({ ...formData, resolutionTimeHours: parseInt(e.target.value) || 1 })}
              error={formErrors.resolutionTimeHours}
              required
            />
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
              Policy is active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPolicy ? 'Update' : 'Create'} Policy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete SLA Policy"
        message={`Are you sure you want to delete "${policyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AdminSLAPage;
