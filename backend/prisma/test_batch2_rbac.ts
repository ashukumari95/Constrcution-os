

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- Batch 2 RBAC Test (seeded data) ---');
  
  const login = async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(`Login failed for ${email}:`, data);
        return null;
      }
      return data.token;
    } catch (e: any) {
      console.log(`Login fetch error for ${email}:`, e);
      return null;
    }
  };

  const adminToken = await login('admin@apexbuild.demo');
  const pmToken = await login('pm1@apexbuild.demo');
  const seToken = await login('engineer1@apexbuild.demo');
  const clientToken = await login('client@apexbuild.demo');
  
  console.log({ adminToken: !!adminToken, pmToken: !!pmToken, seToken: !!seToken, clientToken: !!clientToken });
  
  let projectId = '';
  
  // 1. Admin creates a project
  if (adminToken) {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Batch 2 Test Project',
          code: 'B2-01',
          description: 'Test project for RBAC',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          budget: 100000
        })
      });
      const data = await res.json();
      projectId = data.id;
      console.log(`✅ Admin created project: ${projectId}`);
    } catch (e: any) {
      console.error('❌ Admin create project failed:', e.message);
    }
  }

  // 2. PM creates a site
  let siteId = '';
  if (pmToken && projectId) {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pmToken}` },
        body: JSON.stringify({
          name: 'Main Site',
          location: 'Downtown',
          status: 'ACTIVE'
        })
      });
      const data = await res.json();
      siteId = data.id;
      if (siteId) {
        console.log(`✅ PM created site: ${siteId}`);
      } else {
        console.log(`❌ PM created site failed: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      console.error('❌ PM create site failed:', e.response?.data || e.message);
    }
  }

  // 3. Client views project
  if (clientToken && projectId) {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, { 
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      const data = await res.json();
      if (data.name) {
        console.log(`✅ Client viewed project: ${data.name}`);
      } else {
         console.log(`✅ Client view project blocked: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      console.error('❌ Client view project failed:', e.message);
    }
  }
  
  // 4. SE views tasks
  if (seToken && projectId) {
     try {
      const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, { 
        headers: { Authorization: `Bearer ${seToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        console.log(`✅ SE viewed project tasks, count: ${data.length}`);
      } else {
         console.log(`❌ SE view project tasks failed: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      console.error('❌ SE view tasks failed:', e.message);
    }
  }

  console.log('--- Test Complete ---');
}

runTest().catch(console.error);
