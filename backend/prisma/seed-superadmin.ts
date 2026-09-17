import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SUPER_ADMIN user...');

  const passwordHash = await bcrypt.hash('superadmin123', 10);

  // 1. Create or find the Platform Organization
  const platformOrg = await prisma.organization.upsert({
    where: { subdomain: 'admin' },
    update: {},
    create: {
      name: 'ConstructionOS Platform',
      subdomain: 'admin',
      plan: 'PLATFORM',
    }
  });

  // 2. Create or find the SUPER_ADMIN role for the platform org
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', organizationId: platformOrg.id }
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        permissions: JSON.stringify(['all', 'platform.manage']),
        organizationId: platformOrg.id
      }
    });
  }

  // 3. Create or find the SUPER_ADMIN user
  const superAdminEmail = 'superadmin@constructionos.com';
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: passwordHash,
      roleId: superAdminRole.id,
      organizationId: platformOrg.id
    },
    create: {
      email: superAdminEmail,
      firstName: 'Platform',
      lastName: 'Administrator',
      passwordHash: passwordHash,
      roleId: superAdminRole.id,
      organizationId: platformOrg.id
    }
  });

  console.log('Successfully created SUPER_ADMIN:');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Password: superadmin123`);
  console.log(`Organization: ${platformOrg.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
