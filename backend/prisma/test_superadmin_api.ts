import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testSuperAdmin() {
  try {
    // 1. Login as Super Admin
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://admin.localhost:5173' },
      body: JSON.stringify({ email: 'admin@constructionos.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in as Super Admin:', token.substring(0, 20) + '...');

    // 2. Fetch all projects across all organizations
    const projRes = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const projects = await projRes.json();
    
    if (projects.some((p: any) => p.name === 'ABC Mega Tower')) {
      console.log('✅ Super Admin can see cross-tenant projects (e.g. ABC Mega Tower)');
    } else {
      console.error('❌ Super Admin failed to see ABC Mega Tower! Found:', projects.map((p: any) => p.name));
    }

  } catch (error: any) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperAdmin();
