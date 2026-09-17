const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  
  await prisma.user.updateMany({
    data: { passwordHash }
  });
  
  console.log('All users updated to Password123!');
}

main().finally(() => prisma.$disconnect());
