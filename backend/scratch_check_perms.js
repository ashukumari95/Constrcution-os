const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@constructionos.com' },
    include: { role: true }
  });
  console.log('Permissions:', user.role.permissions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
