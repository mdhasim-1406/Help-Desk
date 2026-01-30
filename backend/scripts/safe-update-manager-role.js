// backend/scripts/safe-update-manager-role.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting safe MANAGER role update...');

    // 1. Find the MANAGER role
    const managerRole = await prisma.role.findUnique({
        where: { name: 'MANAGER' }
    });

    if (!managerRole) {
        console.error('❌ Error: MANAGER role not found in database.');
        process.exit(1);
    }

    // 2. Parse current permissions
    let permissions = [];
    try {
        if (typeof managerRole.permissions === 'string') {
            permissions = JSON.parse(managerRole.permissions);
        } else if (Array.isArray(managerRole.permissions)) {
            permissions = managerRole.permissions;
        }
    } catch (e) {
        console.error('❌ Error parsing permissions:', e);
        process.exit(1);
    }

    // 3. Add tickets:assign if not already present
    if (!permissions.includes('tickets:assign')) {
        console.log('➕ Adding "tickets:assign" permission to MANAGER role...');
        permissions.push('tickets:assign');

        // 4. Update the role in the database
        await prisma.role.update({
            where: { id: managerRole.id },
            data: {
                permissions: permissions
            }
        });
        console.log('✅ Success: MANAGER role updated successfully.');
    } else {
        console.log('ℹ️ MANAGER role already has "tickets:assign" permission. No changes needed.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Update failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
