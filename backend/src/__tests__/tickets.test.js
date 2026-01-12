const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Mock sanitizer implementation to avoid JSDOM/ESM issues in Jest
jest.mock('../utils/sanitizer', () => ({
    sanitizeMiddleware: () => (req, res, next) => next(),
    sanitize: (str) => typeof str === 'string' ? str.replace(/<script>.*<\/script>/g, '') : str
}));

const app = require('../index');

describe('Tickets & RBAC', () => {
    let customerToken;
    let adminToken;
    let customerId;

    beforeAll(async () => {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

        // Create Customer
        const customerRole = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });
        const customer = await prisma.user.create({
            data: {
                email: `test-cust-${Date.now()}@example.com`,
                passwordHash: 'hash',
                firstName: 'Cust',
                lastName: 'User',
                roleId: customerRole.id,
                isActive: true
            },
            include: { role: true }
        });
        customerId = customer.id;
        customerToken = jwt.sign({ userId: customer.id, email: customer.email, role: 'CUSTOMER' }, JWT_SECRET);

        // Create Admin
        const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
        const admin = await prisma.user.create({
            data: {
                email: `test-admin-${Date.now()}@example.com`,
                passwordHash: 'hash',
                firstName: 'Admin',
                lastName: 'User',
                roleId: adminRole.id,
                isActive: true
            },
            include: { role: true }
        });
        adminToken = jwt.sign({ userId: admin.id, email: admin.email, role: 'ADMIN' }, JWT_SECRET);

        // Ensure default status exists
        const defaultStatus = await prisma.ticketStatus.findFirst({ where: { isDefault: true } });
        if (!defaultStatus) {
            await prisma.ticketStatus.create({
                data: { name: 'OPEN', displayName: 'Open', color: '#000000', isDefault: true }
            });
        }
    });

    afterAll(async () => {
        await prisma.ticket.deleteMany({ where: { description: { contains: 'TEST_TICKET' } } });
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: 'test-cust-' } },
                    { email: { contains: 'test-admin-' } }
                ]
            }
        });
        await prisma.$disconnect();
    });

    test('POST /api/tickets - Customer should create a ticket', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                title: 'Test Ticket 1',
                description: 'This is a description for TEST_TICKET 1',
                priority: 'LOW'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('ticketNumber');
    });

    test('GET /api/tickets - Customer should see only their own tickets', async () => {
        const res = await request(app)
            .get('/api/tickets')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.statusCode).toBe(200);
        // Should pass, assuming they created one above
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach(ticket => {
            expect(ticket.customer.email).toContain('test-cust-');
        });
    });

    test('GET /api/tickets - Admin should see all tickets', async () => {
        const res = await request(app)
            .get('/api/tickets')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
