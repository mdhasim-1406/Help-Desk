const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();

        if (userCount === 0) {
            console.log('🌱 Database appears empty (no users). Running seed...');
            execSync('node prisma/seed.js', { stdio: 'inherit' });
        } else {
            console.log('✅ Database already populated. Skipping seed.');
        }
    } catch (error) {
        console.error('❌ Failed to check database state:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
