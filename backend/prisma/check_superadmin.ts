import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@constructionos.com' } });
  console.log('Super admin exists:', !!user);
  await prisma.$disconnect();
}
checkSuperAdmin();
