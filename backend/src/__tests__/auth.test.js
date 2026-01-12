const request = require('supertest');

// Mock sanitizer implementation to avoid JSDOM/ESM issues in Jest
jest.mock('../utils/sanitizer', () => ({
    sanitizeMiddleware: () => (req, res, next) => next(),
    sanitize: (str) => str
}));

const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Authentication & Rate Limiting', () => {
    let customerEmail = `test-auth-${Date.now()}@example.com`;
    const password = 'password123';

    beforeAll(async () => {
        // Create a test user
        const role = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });
        if (!role) throw new Error('Role CUSTOMER not found');

        // We register via API to test registration too
    });

    afterAll(async () => {
        // Clean up
        await prisma.user.deleteMany({ where: { email: { contains: 'test-auth-' } } });
        await prisma.$disconnect();
    });

    test('POST /api/auth/register - should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: customerEmail,
                password: password,
                firstName: 'Test',
                lastName: 'User'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toHaveProperty('email', customerEmail);
    });

    test('POST /api/auth/login - should login successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: customerEmail,
                password: password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - should fail with invalid password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: customerEmail,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
    });

    test('Rate Limiting - should block too many login attempts', async () => {
        // The limit is 5 per 15 min. We already did 2 calls (valid, invalid).
        // Let's fire 4 more rapid requests
        for (let i = 0; i < 4; i++) {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: customerEmail,
                    password: 'wrongpassword' // Fail purposefully
                });
        }

        // This 7th attempt (2 prev + 4 loop = 6 total attempts) should get blocked? 
        // Wait, let's just make sure we hit the limit. 
        // Limit is 5. Attempts so far: 1 (login setup) + 1 (invalid) + 4 = 6.
        // The 6th attempt should definitely trigger 429.

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: customerEmail,
                password: 'password123'
            });

        // Note: Rate limiter might return 429
        if (res.statusCode !== 429) {
            console.warn('Rate limit did not trigger as expected, status:', res.statusCode);
        }
        expect(res.statusCode).toBe(429);
    });
});
