import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Dropdown from '../common/Dropdown';
import Avatar from '../common/Avatar';
import { normalizeToString } from '@/utils/normalize';

const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get base path for current user's role
  const getBasePath = () => {
    const role = normalizeToString(user?.role, 'CUSTOMER').toUpperCase();
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'AGENT':
        return '/agent';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const basePath = getBasePath();

  const menuItems = [
    {
      label: 'My Profile',
      icon: User,
      onClick: () => navigate(`${basePath}/profile`)
    },
    // Only show Settings for admin
    ...(normalizeToString(user?.role, 'CUSTOMER').toUpperCase() === 'ADMIN' ? [{
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate('/admin/settings')
    }] : []),
    // Show admin link if user is admin (separate admin panel link)
    ...(normalizeToString(user?.role, 'CUSTOMER').toUpperCase() === 'ADMIN' ? [{
      label: 'Admin Dashboard',
      icon: Shield,
      onClick: () => navigate('/admin/dashboard')
    }] : []),
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleLogout,
      destructive: true,
      className: 'border-t border-slate-100 dark:border-slate-800 mt-1 pt-2'
    }
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 focus:outline-none">
          <Avatar 
            src={user?.avatar} 
            name={user?.name} 
            size="sm"
            className="border-2 border-primary-500/20"
          />
        </button>
      }
      items={menuItems}
      align="right"
    />
  );
};

export default UserMenu;
