import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 2 & 4: Tenant Testing ---');
  
  // 1. Create Org A and Org B
  const orgA = await prisma.organization.create({
    data: { name: 'ABC Construction', subdomain: 'abc' }
  });
  
  const orgB = await prisma.organization.create({
    data: { name: 'XYZ Builders', subdomain: 'xyz' }
  });

  // 2. Fetch system role COMPANY_ADMIN
  const role = await prisma.role.findFirst({
    where: { name: 'COMPANY_ADMIN', organizationId: null }
  });

  if (!role) {
    throw new Error('System role COMPANY_ADMIN not found!');
  }

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const userA = await prisma.user.create({
    data: {
      email: 'admin@abc.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'ABC',
      organizationId: orgA.id,
      roleId: role.id
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'admin@xyz.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'XYZ',
      organizationId: orgB.id,
      roleId: role.id
    }
  });

  console.log(`Created Org A (${orgA.id}) with User: ${userA.email}`);
  console.log(`Created Org B (${orgB.id}) with User: ${userB.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
