import { USER_ROLES, ROLE_HIERARCHY } from './constants';

// ============================================
// Permission Checker Functions
// ============================================

/**
 * Check if user role meets minimum required role
 */
export function hasMinRole(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(userRole, routeRole) {
  return hasMinRole(userRole, routeRole);
}

/**
 * Check if user can view a ticket
 */
export function canViewTicket(user, ticket) {
  if (!user || !ticket) return false;
  
  const role = user.role;
  
  // Admin can view all tickets
  if (role === USER_ROLES.ADMIN) return true;
  
  // Manager can view all tickets in their department
  if (role === USER_ROLES.MANAGER) {
    return ticket.departmentId === user.departmentId;
  }
  
  // Agent can view tickets in their department or assigned to them
  if (role === USER_ROLES.AGENT) {
    return (
      ticket.assigneeId === user.id ||
      ticket.departmentId === user.departmentId
    );
  }
  
  // Customer can only view own tickets
  if (role === USER_ROLES.CUSTOMER) {
    return ticket.customerId === user.id || ticket.createdBy === user.id;
  }
  
  return false;
}

/**
 * Check if user can edit a ticket
 */
export function canEditTicket(user, ticket) {
  if (!user || !ticket) return false;
  
  const role = user.role;
  
  // Admin can edit all tickets
  if (role === USER_ROLES.ADMIN) return true;
  
  // Manager can edit tickets in their department
  if (role === USER_ROLES.MANAGER) {
    return ticket.departmentId === user.departmentId;
  }
  
  // Agent can edit assigned tickets
  if (role === USER_ROLES.AGENT) {
    return ticket.assigneeId === user.id;
  }
  
  // Customer can edit own open tickets
  if (role === USER_ROLES.CUSTOMER) {
    return (
      (ticket.customerId === user.id || ticket.createdBy === user.id) &&
      ticket.status !== 'CLOSED'
    );
  }
  
  return false;
}

/**
 * Check if user can delete a ticket
 */
export function canDeleteTicket(user, ticket) {
  if (!user || !ticket) return false;
  
  // Only admin can delete tickets
  return user.role === USER_ROLES.ADMIN;
}

/**
 * Check if user can assign a ticket
 */
export function canAssignTicket(user, ticket) {
  if (!user || !ticket) return false;
  
  const role = user.role;
  
  // Admin can assign any ticket
  if (role === USER_ROLES.ADMIN) return true;
  
  // Manager can assign tickets in their department
  if (role === USER_ROLES.MANAGER) {
    return ticket.departmentId === user.departmentId;
  }
  
  // Agent can claim unassigned tickets in their department
  if (role === USER_ROLES.AGENT) {
    return (
      !ticket.assigneeId &&
      ticket.departmentId === user.departmentId
    );
  }
  
  return false;
}

/**
 * Check if user can view another user
 */
export function canViewUser(currentUser, targetUser) {
  if (!currentUser || !targetUser) return false;
  
  const role = currentUser.role;
  
  // Admin can view all users
  if (role === USER_ROLES.ADMIN) return true;
  
  // Manager can view users in their department
  if (role === USER_ROLES.MANAGER) {
    return targetUser.departmentId === currentUser.departmentId;
  }
  
  // Agent can view other agents in their department
  if (role === USER_ROLES.AGENT) {
    return (
      targetUser.departmentId === currentUser.departmentId &&
      hasMinRole(USER_ROLES.AGENT, targetUser.role)
    );
  }
  
  // Customer can only view themselves
  if (role === USER_ROLES.CUSTOMER) {
    return targetUser.id === currentUser.id;
  }
  
  return false;
}

/**
 * Check if user can edit another user
 */
export function canEditUser(currentUser, targetUser) {
  if (!currentUser || !targetUser) return false;
  
  // Only admin can edit users
  return currentUser.role === USER_ROLES.ADMIN;
}

/**
 * Check if user can manage departments
 */
export function canManageDepartment(user) {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN;
}

/**
 * Check if user can manage SLA policies
 */
export function canManageSLA(user) {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN;
}

/**
 * Check if user can perform KB action
 * @param {Object} user - Current user
 * @param {string} action - 'read-public', 'read-internal', 'create', 'edit', 'delete'
 * @param {Object} article - Article object (for edit/delete)
 */
export function canManageKB(user, action, article = null) {
  if (!user) return false;
  
  const role = user.role;
  
  switch (action) {
    case 'read-public':
      // Everyone can read public articles
      return true;
      
    case 'read-internal':
      // Staff can read internal articles
      return hasMinRole(role, USER_ROLES.AGENT);
      
    case 'create':
      // Agent and above can create articles
      return hasMinRole(role, USER_ROLES.AGENT);
      
    case 'edit':
      // Admin can edit all, Manager can edit all, Agent can edit own
      if (role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER) {
        return true;
      }
      if (role === USER_ROLES.AGENT && article) {
        return article.authorId === user.id;
      }
      return false;
      
    case 'delete':
      // Only Manager and Admin can delete
      return role === USER_ROLES.MANAGER || role === USER_ROLES.ADMIN;
      
    default:
      return false;
  }
}

// ============================================
// Permission Sets
// ============================================

/**
 * Get ticket permissions for user
 */
export function getTicketPermissions(user, ticket) {
  return {
    view: canViewTicket(user, ticket),
    create: true, // All users can create tickets
    edit: canEditTicket(user, ticket),
    delete: canDeleteTicket(user, ticket),
    assign: canAssignTicket(user, ticket),
    close: canEditTicket(user, ticket),
  };
}

/**
 * Get user management permissions
 */
export function getUserPermissions(currentUser) {
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const isManager = currentUser?.role === USER_ROLES.MANAGER;
  
  return {
    view: isAdmin || isManager,
    create: isAdmin,
    edit: isAdmin,
    delete: isAdmin,
  };
}

/**
 * Get KB permissions for user
 */
export function getKBPermissions(user) {
  const role = user?.role;
  
  return {
    viewPublic: true,
    viewInternal: hasMinRole(role, USER_ROLES.AGENT),
    create: hasMinRole(role, USER_ROLES.AGENT),
    edit: hasMinRole(role, USER_ROLES.AGENT),
    delete: role === USER_ROLES.MANAGER || role === USER_ROLES.ADMIN,
  };
}
