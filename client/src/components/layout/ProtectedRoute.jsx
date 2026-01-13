import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Spinner from '@/components/common/Spinner';
import { normalizeToString } from '@/utils/normalize';
import { ROLE_DASHBOARD_MAP } from '@/utils/constants';

/**
 * Get the default dashboard path for a given role
 */
export function getDefaultDashboard(role) {
  const normalizedRole = normalizeToString(role, 'unknown').toUpperCase();
  const dashboard = ROLE_DASHBOARD_MAP[normalizedRole];

  if (!dashboard) {
    console.error(`[ProtectedRoute] No dashboard found for role: ${role}`);
    return null;
  }

  return dashboard;
}

/**
 * ProtectedRoute Component
 * 
 * @param {React.Node} children - Component to render if authorized
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
const ProtectedRoute = ({
  children,
  allowedRoles = []
}) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is in the allowed roles
  const userRole = normalizeToString(user?.role, 'CUSTOMER').toUpperCase();
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to their appropriate dashboard
    return <Navigate to={getDefaultDashboard(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
