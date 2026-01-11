const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in correct order (respecting foreign keys)
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.kBArticle.deleteMany();
  await prisma.kBCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  await prisma.ticketStatus.deleteMany();
  await prisma.role.deleteMany();

  // Hash password (same for all test users)
  const password = await bcrypt.hash('password123', 10);

  // ============================================================================
  // CREATE ROLES
  // ============================================================================
  console.log('Creating roles...');
  
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      permissions: ['*']
    }
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      displayName: 'Administrator',
      permissions: [
        'users:*', 'departments:*', 'tickets:*', 'sla:*', 'kb:*', 'reports:*', 'settings:*'
      ]
    }
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      displayName: 'Manager',
      permissions: [
        'users:read', 'users:read:department',
        'tickets:read:department', 'tickets:update:department', 'tickets:assign:department',
        'reports:read:department', 'kb:read'
      ]
    }
  });

  const agentRole = await prisma.role.create({
    data: {
      name: 'AGENT',
      displayName: 'Support Agent',
      permissions: [
        'tickets:read:assigned', 'tickets:read:unassigned:department',
        'tickets:update:assigned', 'tickets:comment:assigned',
        'kb:read'
      ]
    }
  });

  const customerRole = await prisma.role.create({
    data: {
      name: 'CUSTOMER',
      displayName: 'Customer',
      permissions: [
        'tickets:create', 'tickets:read:own', 'tickets:comment:own', 'kb:read:public'
      ]
    }
  });

  // ============================================================================
  // CREATE TICKET STATUSES
  // ============================================================================
  console.log('Creating ticket statuses...');

  const statusOpen = await prisma.ticketStatus.create({
    data: {
      name: 'OPEN',
      displayName: 'Open',
      color: '#3B82F6',
      order: 1,
      isDefault: true
    }
  });

  const statusInProgress = await prisma.ticketStatus.create({
    data: {
      name: 'IN_PROGRESS',
      displayName: 'In Progress',
      color: '#F59E0B',
      order: 2
    }
  });

  const statusWaiting = await prisma.ticketStatus.create({
    data: {
      name: 'WAITING_CUSTOMER',
      displayName: 'Waiting on Customer',
      color: '#8B5CF6',
      order: 3
    }
  });

  const statusResolved = await prisma.ticketStatus.create({
    data: {
      name: 'RESOLVED',
      displayName: 'Resolved',
      color: '#10B981',
      order: 4,
      isResolved: true
    }
  });

  const statusClosed = await prisma.ticketStatus.create({
    data: {
      name: 'CLOSED',
      displayName: 'Closed',
      color: '#6B7280',
      order: 5,
      isClosed: true
    }
  });

  // ============================================================================
  // CREATE DEPARTMENTS
  // ============================================================================
  console.log('Creating departments...');

  const techSupport = await prisma.department.create({
    data: {
      name: 'Technical Support',
      description: 'Hardware and software technical issues'
    }
  });

  const billing = await prisma.department.create({
    data: {
      name: 'Billing & Accounts',
      description: 'Payment, invoices, and account issues'
    }
  });

  // ============================================================================
  // CREATE SLA POLICIES
  // ============================================================================
  console.log('Creating SLA policies...');

  await prisma.sLAPolicy.create({
    data: {
      name: 'Urgent Priority SLA',
      priority: 'URGENT',
      responseTime: 60,      // 1 hour in minutes
      resolutionTime: 240,   // 4 hours in minutes
      warningThreshold: 80,
      isActive: true
    }
  });

  await prisma.sLAPolicy.create({
    data: {
      name: 'High Priority SLA',
      priority: 'HIGH',
      responseTime: 240,     // 4 hours
      resolutionTime: 1440,  // 24 hours
      warningThreshold: 80,
      isActive: true
    }
  });

  await prisma.sLAPolicy.create({
    data: {
      name: 'Medium Priority SLA',
      priority: 'MEDIUM',
      responseTime: 480,     // 8 hours
      resolutionTime: 2880,  // 48 hours
      warningThreshold: 80,
      isActive: true
    }
  });

  await prisma.sLAPolicy.create({
    data: {
      name: 'Low Priority SLA',
      priority: 'LOW',
      responseTime: 1440,    // 24 hours
      resolutionTime: 4320,  // 72 hours
      warningThreshold: 80,
      isActive: true
    }
  });

  // ============================================================================
  // CREATE USERS
  // ============================================================================
  console.log('Creating users...');

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@helpdesk.com',
      passwordHash: password,
      firstName: 'System',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      isActive: true
    }
  });

  // Tech Support Manager
  const techManager = await prisma.user.create({
    data: {
      email: 'tech.manager@helpdesk.com',
      passwordHash: password,
      firstName: 'Sarah',
      lastName: 'Johnson',
      roleId: managerRole.id,
      departmentId: techSupport.id,
      isActive: true
    }
  });

  // Update department with manager
  await prisma.department.update({
    where: { id: techSupport.id },
    data: { managerId: techManager.id }
  });

  // Billing Manager
  const billingManager = await prisma.user.create({
    data: {
      email: 'billing.manager@helpdesk.com',
      passwordHash: password,
      firstName: 'Michael',
      lastName: 'Chen',
      roleId: managerRole.id,
      departmentId: billing.id,
      isActive: true
    }
  });

  // Update department with manager
  await prisma.department.update({
    where: { id: billing.id },
    data: { managerId: billingManager.id }
  });

  // Tech Support Agents
  const agent1 = await prisma.user.create({
    data: {
      email: 'john.agent@helpdesk.com',
      passwordHash: password,
      firstName: 'John',
      lastName: 'Smith',
      roleId: agentRole.id,
      departmentId: techSupport.id,
      isActive: true
    }
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'emma.agent@helpdesk.com',
      passwordHash: password,
      firstName: 'Emma',
      lastName: 'Wilson',
      roleId: agentRole.id,
      departmentId: techSupport.id,
      isActive: true
    }
  });

  // Billing Agents
  const agent3 = await prisma.user.create({
    data: {
      email: 'david.agent@helpdesk.com',
      passwordHash: password,
      firstName: 'David',
      lastName: 'Brown',
      roleId: agentRole.id,
      departmentId: billing.id,
      isActive: true
    }
  });

  const agent4 = await prisma.user.create({
    data: {
      email: 'lisa.agent@helpdesk.com',
      passwordHash: password,
      firstName: 'Lisa',
      lastName: 'Taylor',
      roleId: agentRole.id,
      departmentId: billing.id,
      isActive: true
    }
  });

  // Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'alice@customer.com',
      passwordHash: password,
      firstName: 'Alice',
      lastName: 'Anderson',
      roleId: customerRole.id,
      isActive: true
    }
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'bob@customer.com',
      passwordHash: password,
      firstName: 'Bob',
      lastName: 'Baker',
      roleId: customerRole.id,
      isActive: true
    }
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'carol@customer.com',
      passwordHash: password,
      firstName: 'Carol',
      lastName: 'Clark',
      roleId: customerRole.id,
      isActive: true
    }
  });

  const customer4 = await prisma.user.create({
    data: {
      email: 'dan@customer.com',
      passwordHash: password,
      firstName: 'Dan',
      lastName: 'Davis',
      roleId: customerRole.id,
      isActive: true
    }
  });

  // ============================================================================
  // CREATE TICKETS
  // ============================================================================
  console.log('Creating sample tickets...');

  // Customer 1 (Alice) tickets - 2 tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000001',
      title: 'Cannot login to my account',
      description: 'I keep getting "invalid password" error even though I am entering the correct password. I have tried resetting my password but still cannot log in.',
      priority: 'HIGH',
      statusId: statusOpen.id,
      customerId: customer1.id,
      departmentId: techSupport.id
    }
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000002',
      title: 'Billing discrepancy on invoice',
      description: 'My latest invoice shows $150 but I was quoted $100 for the service. Please review and correct.',
      priority: 'MEDIUM',
      statusId: statusInProgress.id,
      customerId: customer1.id,
      departmentId: billing.id,
      assignedToId: agent3.id
    }
  });

  // Customer 2 (Bob) tickets - 2 tickets
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000003',
      title: 'Software installation failed',
      description: 'Getting error code 0x80070005 when trying to install the application. I have tried running as administrator but still fails.',
      priority: 'URGENT',
      statusId: statusOpen.id,
      customerId: customer2.id,
      departmentId: techSupport.id,
      assignedToId: agent1.id
    }
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000004',
      title: 'Request for refund',
      description: 'I would like to request a full refund for my subscription as I no longer need the service. Please process ASAP.',
      priority: 'LOW',
      statusId: statusWaiting.id,
      customerId: customer2.id,
      departmentId: billing.id,
      assignedToId: agent4.id
    }
  });

  // Customer 3 (Carol) tickets - 1 ticket
  const ticket5 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000005',
      title: 'Slow system performance',
      description: 'The application has become very slow over the past week. Takes 10+ seconds to load pages. This is affecting my productivity.',
      priority: 'MEDIUM',
      statusId: statusInProgress.id,
      customerId: customer3.id,
      departmentId: techSupport.id,
      assignedToId: agent2.id
    }
  });

  // Customer 4 (Dan) tickets - 2 tickets
  const ticket6 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000006',
      title: 'Update payment method',
      description: 'I need to update my credit card on file as the current one has expired. Please advise on the process.',
      priority: 'LOW',
      statusId: statusResolved.id,
      customerId: customer4.id,
      departmentId: billing.id,
      assignedToId: agent3.id
    }
  });

  const ticket7 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-000007',
      title: 'Feature request: Dark mode',
      description: 'Would love to have a dark mode option in the application for easier viewing at night. Many users have been asking for this feature.',
      priority: 'LOW',
      statusId: statusOpen.id,
      customerId: customer4.id,
      departmentId: techSupport.id
      // Unassigned ticket
    }
  });

  // ============================================================================
  // CREATE COMMENTS
  // ============================================================================
  console.log('Creating sample comments...');

  await prisma.ticketComment.create({
    data: {
      content: 'Thank you for reporting this issue. We are looking into it. Can you please provide the browser you are using?',
      ticketId: ticket1.id,
      userId: agent1.id,
      isInternal: false
    }
  });

  await prisma.ticketComment.create({
    data: {
      content: 'Internal note: Customer has had login issues before. Check if account is locked in the system.',
      ticketId: ticket1.id,
      userId: agent1.id,
      isInternal: true
    }
  });

  await prisma.ticketComment.create({
    data: {
      content: 'I have reviewed the invoice. The extra $50 charge was for the premium add-on feature. Did you authorize this upgrade?',
      ticketId: ticket2.id,
      userId: agent3.id,
      isInternal: false
    }
  });

  await prisma.ticketComment.create({
    data: {
      content: 'I did not authorize any add-on or upgrade. Please remove it and adjust my invoice accordingly.',
      ticketId: ticket2.id,
      userId: customer1.id,
      isInternal: false
    }
  });

  await prisma.ticketComment.create({
    data: {
      content: 'I\'ve identified the issue - your antivirus is blocking the installation. Please temporarily disable it and try again.',
      ticketId: ticket3.id,
      userId: agent1.id,
      isInternal: false
    }
  });

  await prisma.ticketComment.create({
    data: {
      content: 'Your refund request has been submitted. Please allow 3-5 business days for processing. We need confirmation that you want to proceed.',
      ticketId: ticket4.id,
      userId: agent4.id,
      isInternal: false
    }
  });

  // ============================================================================
  // CREATE KNOWLEDGE BASE
  // ============================================================================
  console.log('Creating knowledge base...');

  const kbCategory1 = await prisma.kBCategory.create({
    data: {
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Basic guides to help you get started',
      order: 1,
      isActive: true
    }
  });

  const kbCategory2 = await prisma.kBCategory.create({
    data: {
      name: 'Troubleshooting',
      slug: 'troubleshooting',
      description: 'Common issues and how to resolve them',
      order: 2,
      isActive: true
    }
  });

  await prisma.kBArticle.create({
    data: {
      title: 'How to Reset Your Password',
      slug: 'how-to-reset-your-password',
      content: '<h2>Resetting Your Password</h2><p>If you have forgotten your password, follow these steps:</p><ol><li>Click on "Forgot Password" on the login page</li><li>Enter your email address</li><li>Check your email for the reset link</li><li>Click the link and create a new password</li></ol><p>If you continue to have issues, please contact support.</p>',
      excerpt: 'Step-by-step guide to reset your account password',
      categoryId: kbCategory1.id,
      authorId: superAdmin.id,
      isPublished: true,
      isPublic: true,
      views: 145
    }
  });

  await prisma.kBArticle.create({
    data: {
      title: 'Installation Error 0x80070005',
      slug: 'installation-error-0x80070005',
      content: '<h2>Error 0x80070005 - Access Denied</h2><p>This error occurs when you don\'t have sufficient permissions.</p><h3>Solutions:</h3><ul><li>Run the installer as Administrator</li><li>Temporarily disable antivirus</li><li>Check that your user account has admin rights</li></ul>',
      excerpt: 'How to fix the common installation error 0x80070005',
      categoryId: kbCategory2.id,
      authorId: superAdmin.id,
      isPublished: true,
      isPublic: true,
      views: 89
    }
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts Created:');
  console.log('─────────────────────────────────────────────────────');
  console.log('Role       | Email                        | Password');
  console.log('─────────────────────────────────────────────────────');
  console.log('SUPER_ADMIN| admin@helpdesk.com           | password123');
  console.log('MANAGER    | tech.manager@helpdesk.com    | password123');
  console.log('MANAGER    | billing.manager@helpdesk.com | password123');
  console.log('AGENT      | john.agent@helpdesk.com      | password123');
  console.log('AGENT      | emma.agent@helpdesk.com      | password123');
  console.log('AGENT      | david.agent@helpdesk.com     | password123');
  console.log('AGENT      | lisa.agent@helpdesk.com      | password123');
  console.log('CUSTOMER   | alice@customer.com           | password123');
  console.log('CUSTOMER   | bob@customer.com             | password123');
  console.log('CUSTOMER   | carol@customer.com           | password123');
  console.log('CUSTOMER   | dan@customer.com             | password123');
  console.log('─────────────────────────────────────────────────────');
  console.log('');
  console.log('📊 Data Summary:');
  console.log('   Roles: 5');
  console.log('   Departments: 2 (Technical Support, Billing & Accounts)');
  console.log('   Users: 11 (1 admin, 2 managers, 4 agents, 4 customers)');
  console.log('   SLA Policies: 4');
  console.log('   Ticket Statuses: 5');
  console.log('   Tickets: 7');
  console.log('   Comments: 6');
  console.log('   KB Categories: 2');
  console.log('   KB Articles: 2');
  console.log('');
  console.log('🎯 Ticket Distribution:');
  console.log('   Tech Support: 4 tickets (TKT-000001, 000003, 000005, 000007)');
  console.log('   Billing: 3 tickets (TKT-000002, 000004, 000006)');
  console.log('');
  console.log('👤 Customer Ticket Ownership:');
  console.log('   Alice (alice@customer.com): 2 tickets');
  console.log('   Bob (bob@customer.com): 2 tickets');
  console.log('   Carol (carol@customer.com): 1 ticket');
  console.log('   Dan (dan@customer.com): 2 tickets');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
