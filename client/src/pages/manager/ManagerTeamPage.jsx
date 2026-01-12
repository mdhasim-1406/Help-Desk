import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Download, MoreVertical, Users, X, User } from 'lucide-react';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { getUsers, createUser } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const ManagerTeamPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New member form
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch agents from the same department as the manager
      const response = await getUsers({ role: 'AGENT' });
      const users = response.data || response.users || [];

      // Filter to only show agents in manager's department
      const filteredMembers = user?.departmentId
        ? users.filter(u => u.departmentId === user.departmentId)
        : users;

      setTeamMembers(filteredMembers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch team members');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Team Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        ...newMember,
        role: 'AGENT',
        departmentId: user?.departmentId
      });
      addToast('Team member added successfully!', 'success');
      setShowAddModal(false);
      setNewMember({ firstName: '', lastName: '', email: '', password: '' });
      fetchTeamMembers(); // Refresh list
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add team member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle View Profile
  const handleViewProfile = (member) => {
    setSelectedUser(member);
    setShowProfileModal(true);
  };

  // Filter members based on search
  const filteredMembers = teamMembers.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = !searchQuery ||
      fullName.includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load team"
        message={error}
        onRetry={fetchTeamMembers}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your support team members and their performance.</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN') && (
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add Team Member</Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full lg:w-auto">
          <SearchInput
            label="Search Members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            onClear={() => setSearchQuery('')}
          />
        </div>
        <div className="w-full lg:w-48">
          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              { value: 'technical', label: 'Technical Support' },
              { value: 'billing', label: 'Billing' },
              { value: 'general', label: 'General Support' }
            ]}
          />
        </div>
        <Button variant="outline" size="sm" icon={Download}>Export</Button>
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description={searchQuery ? "Try adjusting your search" : "No agents in your department yet"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="p-6 border-none shadow-sm dark:bg-slate-900 overflow-hidden relative hover:shadow-lg transition-shadow">
              {/* Status Indicator */}
              <div className={`absolute top-4 right-4 h-3 w-3 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  {member.firstName?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{member.firstName} {member.lastName}</h3>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                    {member.role?.displayName || member.role?.name || 'Agent'}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Department</span>
                  <span className="font-bold">{member.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-bold ${member.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Assigned Tickets</span>
                  <span className="font-bold">{member._count?.assignedTickets || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleViewProfile(member)}>
                  View Profile
                </Button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-slate-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Team Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={newMember.firstName}
              onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              value={newMember.lastName}
              onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            placeholder="john.doe@company.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={newMember.password}
            onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
            placeholder="••••••••"
            required
          />
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Role:</strong> Agent<br />
              <strong>Department:</strong> {user?.departmentName || 'Your Department'}
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Agent Profile">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="text-slate-500">{selectedUser.email}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${selectedUser.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Role</p>
                <p className="font-medium">{selectedUser.role?.displayName || selectedUser.role?.name || 'Agent'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Department</p>
                <p className="font-medium">{selectedUser.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Assigned Tickets</p>
                <p className="font-medium">{selectedUser._count?.assignedTickets || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Phone</p>
                <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerTeamPage;
