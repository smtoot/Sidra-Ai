
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLegacyData() {
    try {
        const count = await prisma.booking.count({
            where: {
                status: 'CANCELLED_BY_ADMIN',
                cancelledBy: 'TEACHER' // Assuming 'TEACHER' string is stored in cancelledBy
            }
        });
        console.log(`Found ${count} bookings to migrate.`);

        if (count > 0) {
            console.log("Migration recommended.");
        } else {
            console.log("No data to migrate.");
        }
    } catch (e) {
        console.error("Error query:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLegacyData();
