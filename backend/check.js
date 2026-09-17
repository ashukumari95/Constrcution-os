const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, status: true, role: { select: { name: true } } } });
  console.log(users.map(u => u.email).join('\n'));
}

main().finally(() => prisma.$disconnect());
