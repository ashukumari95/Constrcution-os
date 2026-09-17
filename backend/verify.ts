import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log('--- Checking Database State ---');
  try {
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const projectCount = await prisma.project.count();
    console.log(`✅ Database tables exist. Organizations: ${orgCount}, Users: ${userCount}, Roles: ${roleCount}, Projects: ${projectCount}`);

    const demoUser = await prisma.user.findFirst({
      include: { role: true, organization: true }
    });

    if (!demoUser) {
      console.log('❌ No demo user found in database. Seed might have failed.');
      return;
    }

    console.log(`✅ Demo User found: ${demoUser.email} (Role: ${demoUser.role.name}, Org: ${demoUser.organization.name})`);

    console.log('\n--- Verifying Authentication (/api/auth/login) ---');
    try {
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoUser.email,
          password: 'Password123!'
        })
      });
      if (!loginRes.ok) throw new Error(`HTTP error! status: ${loginRes.status}`);
      const loginData = await loginRes.json();
      const token = loginData.token;
      console.log('✅ Login successful. Received JWT token.');

      console.log('\n--- Verifying Current User (/api/auth/me) ---');
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error(`HTTP error! status: ${meRes.status}`);
      const meData = await meRes.json();
      console.log(`✅ /api/auth/me successful. Logged in as: ${meData.email}`);

      console.log('\n✅ All verifications passed.');
    } catch (apiError: any) {
      console.log('❌ API Verification failed:', apiError.message);
      console.log('Is the backend server running on port 5000?');
    }

  } catch (error) {
    console.error('❌ Database query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
