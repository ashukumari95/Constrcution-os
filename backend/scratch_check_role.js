const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@constructionos.com' },
    include: { role: true }
  });
  console.log(user ? `User found. Role name: "${user.role.name}"` : 'User not found');
}

main().catch(console.error).finally(() => prisma.$disconnect());
