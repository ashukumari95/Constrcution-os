import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Production seed executed. No destructive changes made.');
  // The system relies on the Workspace Onboarding Flow to create the initial
  // Organization, Roles, and the first User (COMPANY_ADMIN).
  //
  // For demo data, run: npm run db:seed:demo
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
