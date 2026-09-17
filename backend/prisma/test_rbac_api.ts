import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testRBAC() {
  try {
    const org = await prisma.organization.findUnique({ where: { subdomain: 'abc' } });
    if (!org) throw new Error("Org ABC not found");

    let empRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE', organizationId: org.id } });
    if (!empRole) {
      empRole = await prisma.role.create({
        data: {
          name: 'EMPLOYEE',
          permissions: JSON.stringify(['projects:read']),
          organizationId: org.id
        }
      });
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    
    // UPSERT employee user
    let empUser = await prisma.user.findUnique({ where: { email: 'employee@abc.com' } });
    if (!empUser) {
      empUser = await prisma.user.create({
        data: {
          email: 'employee@abc.com',
          passwordHash,
          firstName: 'Emp',
          lastName: 'ABC',
          organizationId: org.id,
          roleId: empRole.id
        }
      });
    }

    // 1. Login as Admin
    const loginARes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://abc.localhost:5173' },
      body: JSON.stringify({ email: 'admin@abc.com', password: 'password123' })
    });
    const loginA = await loginARes.json();
    const tokenAdmin = loginA.token;

    // 2. Admin fetches users - Should Succeed
    const adminUsersRes = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    if (adminUsersRes.ok) {
      console.log('✅ Admin can fetch users (Status:', adminUsersRes.status, ')');
    } else {
      console.error('❌ Admin failed to fetch users. Status:', adminUsersRes.status);
    }

    // 3. Login as Employee
    const loginEmpRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://abc.localhost:5173' },
      body: JSON.stringify({ email: 'employee@abc.com', password: 'password123' })
    });
    const loginEmp = await loginEmpRes.json();
    const tokenEmp = loginEmp.token;

    // 4. Employee fetches users - Should Fail
    const empUsersRes = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${tokenEmp}` }
    });
    if (empUsersRes.status === 403) {
      console.log('✅ Employee correctly blocked from fetching users (Status: 403)');
    } else {
      console.error('❌ Employee not blocked! Status:', empUsersRes.status);
    }

    // 5. Employee fetches projects - Should Succeed
    const empProjRes = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${tokenEmp}` }
    });
    if (empProjRes.ok) {
      console.log('✅ Employee can fetch projects (Status:', empProjRes.status, ')');
    } else {
      console.error('❌ Employee failed to fetch projects. Status:', empProjRes.status);
    }

  } catch (error: any) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRBAC();
