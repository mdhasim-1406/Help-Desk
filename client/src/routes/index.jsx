import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Spinner from '@/components/common/Spinner';
import { useAuthStore } from '@/store/authStore';

// Layouts
import AuthLayout from '@/components/layout/AuthLayout';
import CustomerLayout from '@/components/layout/CustomerLayout';
import AgentLayout from '@/components/layout/AgentLayout';
import ManagerLayout from '@/components/layout/ManagerLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute, { getDefaultDashboard } from '@/components/layout/ProtectedRoute';

// Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Common Pages
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const KnowledgeBasePage = lazy(() => import('@/pages/common/KnowledgeBasePage'));
const ArticleDetailPage = lazy(() => import('@/pages/common/ArticleDetailPage'));
const CategoryArticlesPage = lazy(() => import('@/pages/common/CategoryArticlesPage'));
const ProfilePage = lazy(() => import('@/pages/common/ProfilePage'));

// Customer Pages
const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'));
const CustomerTicketsPage = lazy(() => import('@/pages/customer/CustomerTicketsPage'));
const CustomerNewTicketPage = lazy(() => import('@/pages/customer/CustomerNewTicketPage'));
const CustomerTicketDetailPage = lazy(() => import('@/pages/customer/CustomerTicketDetailPage'));

// Agent Pages
const AgentDashboardPage = lazy(() => import('@/pages/agent/AgentDashboardPage'));
const AgentTicketQueuePage = lazy(() => import('@/pages/agent/AgentTicketQueuePage'));
const AgentTicketDetailPage = lazy(() => import('@/pages/agent/AgentTicketDetailPage'));

// Manager Pages
const ManagerDashboardPage = lazy(() => import('@/pages/manager/ManagerDashboardPage'));
const ManagerTicketsPage = lazy(() => import('@/pages/manager/ManagerTicketsPage'));
const ManagerTeamPage = lazy(() => import('@/pages/manager/ManagerTeamPage'));
const ManagerReportsPage = lazy(() => import('@/pages/manager/ManagerReportsPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminTicketsPage = lazy(() => import('@/pages/admin/AdminTicketsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminDepartmentsPage = lazy(() => import('@/pages/admin/AdminDepartmentsPage'));
const AdminSLAPage = lazy(() => import('@/pages/admin/AdminSLAPage'));
const AdminKBPage = lazy(() => import('@/pages/admin/AdminKBPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

// Root redirect component - redirects based on user role
const RootRedirect = () => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={getDefaultDashboard(user.role)} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Root Redirect - role-based */}
        <Route path="/" element={<RootRedirect />} />

        {/* Customer Routes */}
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'AGENT', 'MANAGER', 'ADMIN']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<CustomerDashboardPage />} />
          <Route path="tickets" element={<CustomerTicketsPage />} />
          <Route path="tickets/new" element={<CustomerNewTicketPage />} />
          <Route path="tickets/:id" element={<CustomerTicketDetailPage />} />
          <Route path="kb" element={<KnowledgeBasePage />} />
          <Route path="kb/articles/:id" element={<ArticleDetailPage />} />
          <Route path="kb/categories/:id" element={<CategoryArticlesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Agent Routes */}
        <Route 
          path="/agent" 
          element={
            <ProtectedRoute allowedRoles={['AGENT', 'MANAGER', 'ADMIN']}>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AgentDashboardPage />} />
          <Route path="tickets" element={<AgentTicketQueuePage />} />
          <Route path="tickets/:id" element={<AgentTicketDetailPage />} />
          <Route path="kb" element={<KnowledgeBasePage />} />
          <Route path="kb/articles/:id" element={<ArticleDetailPage />} />
          <Route path="kb/categories/:id" element={<CategoryArticlesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Manager Routes */}
        <Route 
          path="/manager" 
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="tickets" element={<ManagerTicketsPage />} />
          <Route path="tickets/:id" element={<AgentTicketDetailPage />} />
          <Route path="team" element={<ManagerTeamPage />} />
          <Route path="reports" element={<ManagerReportsPage />} />
          <Route path="kb" element={<KnowledgeBasePage />} />
          <Route path="kb/articles/:id" element={<ArticleDetailPage />} />
          <Route path="kb/categories/:id" element={<CategoryArticlesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="tickets/:id" element={<AgentTicketDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="sla" element={<AdminSLAPage />} />
          <Route path="kb" element={<AdminKBPage />} />
          <Route path="kb/articles/:id" element={<ArticleDetailPage />} />
          <Route path="kb/categories/:id" element={<CategoryArticlesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Error Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
