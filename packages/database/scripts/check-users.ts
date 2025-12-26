
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`Total users: ${count}`);

    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, phoneNumber: true, role: true, firstName: true }
    });
    console.log('Sample users:', JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
