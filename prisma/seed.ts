import { PrismaClient, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.ticketHistory.deleteMany(),
    prisma.ticketComment.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.kBArticle.deleteMany(),
    prisma.kBCategory.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
    prisma.ticketStatus.deleteMany(),
    prisma.sLAPolicy.deleteMany(),
    prisma.role.deleteMany(),
  ]);

  console.log('✅ Cleaned existing data');

  // Create Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      permissions: ['*'],
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      displayName: 'Administrator',
      permissions: [
        'users:*',
        'tickets:*',
        'departments:*',
        'sla:*',
        'kb:*',
        'reports:read',
        'settings:*',
      ],
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      displayName: 'Manager',
      permissions: [
        'tickets:*',
        'users:read',
        'departments:read',
        'reports:read',
        'kb:*',
      ],
    },
  });

  const agentRole = await prisma.role.create({
    data: {
      name: 'AGENT',
      displayName: 'Agent',
      permissions: [
        'tickets:read',
        'tickets:update',
        'tickets:comment',
        'kb:read',
      ],
    },
  });

  const customerRole = await prisma.role.create({
    data: {
      name: 'CUSTOMER',
      displayName: 'Customer',
      permissions: [
        'tickets:create',
        'tickets:read:own',
        'tickets:comment:own',
        'kb:read:public',
      ],
    },
  });

  console.log('✅ Created roles');

  // Create Departments
  const techSupportDept = await prisma.department.create({
    data: {
      name: 'Technical Support',
      description: 'Handles technical issues and system problems',
    },
  });

  const customerServiceDept = await prisma.department.create({
    data: {
      name: 'Customer Service',
      description: 'Handles general customer inquiries',
    },
  });

  const billingDept = await prisma.department.create({
    data: {
      name: 'Billing',
      description: 'Handles billing and payment issues',
    },
  });

  console.log('✅ Created departments');

  // Create Ticket Statuses
  await prisma.ticketStatus.createMany({
    data: [
      {
        name: 'OPEN',
        displayName: 'Open',
        color: '#3B82F6',
        order: 1,
        isDefault: true,
        isResolved: false,
        isClosed: false,
      },
      {
        name: 'IN_PROGRESS',
        displayName: 'In Progress',
        color: '#F59E0B',
        order: 2,
        isResolved: false,
        isClosed: false,
      },
      {
        name: 'PENDING',
        displayName: 'Pending',
        color: '#8B5CF6',
        order: 3,
        isResolved: false,
        isClosed: false,
      },
      {
        name: 'RESOLVED',
        displayName: 'Resolved',
        color: '#10B981',
        order: 4,
        isResolved: true,
        isClosed: false,
      },
      {
        name: 'CLOSED',
        displayName: 'Closed',
        color: '#6B7280',
        order: 5,
        isResolved: true,
        isClosed: true,
      },
    ],
  });

  console.log('✅ Created ticket statuses');

  // Create SLA Policies
  await prisma.sLAPolicy.createMany({
    data: [
      {
        name: 'Low Priority SLA',
        priority: Priority.LOW,
        responseTime: 1440,  // 24 hours
        resolutionTime: 10080,  // 7 days
        warningThreshold: 80,
      },
      {
        name: 'Medium Priority SLA',
        priority: Priority.MEDIUM,
        responseTime: 480,  // 8 hours
        resolutionTime: 2880,  // 2 days
        warningThreshold: 80,
      },
      {
        name: 'High Priority SLA',
        priority: Priority.HIGH,
        responseTime: 120,  // 2 hours
        resolutionTime: 480,  // 8 hours
        warningThreshold: 75,
      },
      {
        name: 'Urgent Priority SLA',
        priority: Priority.URGENT,
        responseTime: 30,  // 30 minutes
        resolutionTime: 240,  // 4 hours
        warningThreshold: 70,
      },
    ],
  });

  console.log('✅ Created SLA policies');

  // Create Users
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@helpdesk.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@helpdesk.com',
      passwordHash,
      firstName: 'Manager',
      lastName: 'User',
      roleId: managerRole.id,
      departmentId: techSupportDept.id,
      isActive: true,
    },
  });

  // Update department manager
  await prisma.department.update({
    where: { id: techSupportDept.id },
    data: { managerId: managerUser.id },
  });

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@helpdesk.com',
      passwordHash,
      firstName: 'Agent',
      lastName: 'User',
      roleId: agentRole.id,
      departmentId: techSupportDept.id,
      isActive: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@helpdesk.com',
      passwordHash,
      firstName: 'Customer',
      lastName: 'User',
      roleId: customerRole.id,
      isActive: true,
    },
  });

  console.log('✅ Created users');

  // Create KB Categories
  const gettingStartedCat = await prisma.kBCategory.create({
    data: {
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Essential guides for new users',
      order: 1,
    },
  });

  const troubleshootingCat = await prisma.kBCategory.create({
    data: {
      name: 'Troubleshooting',
      slug: 'troubleshooting',
      description: 'Common issues and solutions',
      order: 2,
    },
  });

  console.log('✅ Created KB categories');

  // Create Sample KB Articles
  await prisma.kBArticle.create({
    data: {
      categoryId: gettingStartedCat.id,
      title: 'How to Create Your First Ticket',
      slug: 'how-to-create-your-first-ticket',
      content: `
# How to Create Your First Ticket

Creating a ticket is easy! Follow these simple steps:

1. Click the "New Ticket" button
2. Fill in the subject and description
3. Select the priority level
4. Submit your ticket

Our team will respond according to the SLA policy for your ticket's priority level.
      `.trim(),
      excerpt: 'Learn how to create your first support ticket in our system.',
      isPublic: true,
      isPublished: true,
      authorId: adminUser.id,
      tags: ['getting-started', 'tickets'],
    },
  });

  console.log('✅ Created sample KB articles');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Super Admin: admin@helpdesk.com / admin123');
  console.log('   Manager: manager@helpdesk.com / admin123');
  console.log('   Agent: agent@helpdesk.com / admin123');
  console.log('   Customer: customer@helpdesk.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
