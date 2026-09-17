import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for SUPER_ADMIN role and user...');

  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });

  if (!superAdminRole) {
    console.log('SUPER_ADMIN role not found. Creating it...');
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        permissions: JSON.stringify(['*']),
        organizationId: null
      }
    });
  } else {
    console.log('SUPER_ADMIN role exists.');
  }

  let superAdminUser = await prisma.user.findFirst({
    where: { roleId: superAdminRole.id }
  });

  if (!superAdminUser) {
    console.log('No user with SUPER_ADMIN role found. Creating default admin@constructionos.com...');
    
    // We need a platform organization for the super admin
    let platformOrg = await prisma.organization.findFirst({
      where: { subdomain: 'admin' }
    });

    if (!platformOrg) {
      platformOrg = await prisma.organization.create({
        data: {
          name: 'ConstructionOS Platform',
          subdomain: 'admin',
          primaryColor: '#0f172a'
        }
      });
    }

    // Hash password for 'admin123'
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('admin123', 10);

    superAdminUser = await prisma.user.create({
      data: {
        email: 'admin@constructionos.com',
        firstName: 'Platform',
        lastName: 'Admin',
        passwordHash,
        status: 'ACTIVE',
        organizationId: platformOrg.id,
        roleId: superAdminRole.id
      }
    });
    console.log(`Created super admin user: ${superAdminUser.email} (Password: admin123)`);
  } else {
    console.log(`Super admin user exists: ${superAdminUser.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
