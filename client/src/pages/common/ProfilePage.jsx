import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Camera, 
  Save,
  Phone,
  Building2,
  Bell,
  Eye,
  EyeOff,
  LogOut,
  Loader2
} from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Toggle from '@/components/common/Toggle';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import { useUIStore } from '@/store/uiStore';
import * as userService from '@/services/userService';
import * as authService from '@/services/authService';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [notifications, setNotifications] = useState({
    emailTicketUpdates: true,
    emailNewAssignments: true,
    emailSLABreaches: true,
    pushNotifications: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await userService.updateUser(user.id, formData);
      
      // Update user in auth store
      setUser({ ...user, ...formData });
      
      addToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      addToast('Password changed successfully!', 'success');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Failed to change password:', error);
      addToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'error');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setShowAvatarModal(true);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await userService.uploadAvatar(user.id, formData);
      
      // Update user avatar in auth store
      setUser({ ...user, avatar: response.data.avatar || response.avatar });
      
      addToast('Avatar updated successfully!', 'success');
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      addToast('Failed to upload avatar', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    addToast('Notification preferences updated', 'success');
  };

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your profile and security preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar
                name={`${user?.firstName} ${user?.lastName}`}
                src={user?.avatar}
                size="xl"
                className="mx-auto"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white shadow-lg hover:bg-primary-700 transition-colors cursor-pointer"
              >
                <Camera size={16} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-1">
              {user?.role?.toLowerCase()} Account
            </p>
            {user?.department && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center gap-1">
                <Building2 size={12} />
                {user.department.name}
              </p>
            )}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Log Out
              </Button>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-6">
            <h4 className="font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Shield size={18} className="text-primary-500" />
              Security
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Password</span>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Two-Factor Auth</span>
                <span className="text-slate-400 text-xs">Coming Soon</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Personal Information
              </h3>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  icon={User}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  icon={User}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <Input
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                icon={Phone}
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-primary-500" />
                Notification Preferences
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive email updates for ticket changes
                  </p>
                </div>
                <Toggle
                  checked={notifications.emailTicketUpdates}
                  onChange={() => handleNotificationToggle('emailTicketUpdates')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">New Assignments</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Get notified when tickets are assigned to you
                  </p>
                </div>
                <Toggle
                  checked={notifications.emailNewAssignments}
                  onChange={() => handleNotificationToggle('emailNewAssignments')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">SLA Breach Alerts</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Urgent alerts for SLA breaches
                  </p>
                </div>
                <Toggle
                  checked={notifications.emailSLABreaches}
                  onChange={() => handleNotificationToggle('emailSLABreaches')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Browser push notifications
                  </p>
                </div>
                <Toggle
                  checked={notifications.pushNotifications}
                  onChange={() => handleNotificationToggle('pushNotifications')}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setPasswordErrors({});
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose a strong password that you don't use elsewhere.
          </p>
          
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              error={passwordErrors.currentPassword}
              icon={Key}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              error={passwordErrors.newPassword}
              icon={Key}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={passwordErrors.confirmPassword}
              icon={Key}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => {
          setShowAvatarModal(false);
          setAvatarFile(null);
          setAvatarPreview(null);
        }}
        title="Update Profile Picture"
      >
        <div className="space-y-4">
          {avatarPreview && (
            <div className="flex justify-center">
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
              />
            </div>
          )}
          
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAvatarModal(false);
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadAvatar}
              disabled={isUploadingAvatar || !avatarFile}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
