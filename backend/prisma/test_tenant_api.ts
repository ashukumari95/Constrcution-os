const API_URL = 'http://localhost:5000/api';

async function testTenantIsolation() {
  try {
    // 1. Login as User A (ABC Construction)
    const loginARes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://abc.localhost:5173' },
      body: JSON.stringify({ email: 'admin@abc.com', password: 'password123' })
    });
    const loginA = await loginARes.json();
    const tokenA = loginA.token;
    console.log('Logged in as User A:', tokenA ? tokenA.substring(0, 20) + '...' : loginA);

    // 2. Login as User B (XYZ Builders)
    const loginBRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://xyz.localhost:5173' },
      body: JSON.stringify({ email: 'admin@xyz.com', password: 'password123' })
    });
    const loginB = await loginBRes.json();
    const tokenB = loginB.token;
    console.log('Logged in as User B:', tokenB ? tokenB.substring(0, 20) + '...' : loginB);

    // 3. User A creates a Project
    const projectACreateRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'ABC Mega Tower',
        description: 'A very tall tower for ABC',
        status: 'PLANNING'
      })
    });
    const projectA = await projectACreateRes.json();
    console.log('User A created Project:', projectA.name);

    // 4. User B gets list of projects - should NOT include ABC Mega Tower
    const userBProjectsRes = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const userBProjects = await userBProjectsRes.json();
    
    const bCanSeeA = userBProjects.some((p: any) => p.id === projectA.id);
    if (bCanSeeA) {
      console.error('❌ TENANT ISOLATION FAILED: User B can see User A project');
    } else {
      console.log('✅ User B cannot see User A projects');
    }

    // 5. Try to force fetch User A's project directly as User B
    const bFetchARes = await fetch(`${API_URL}/projects/${projectA.id}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    
    if (bFetchARes.status === 404 || bFetchARes.status === 403) {
      console.log('✅ User B denied access to User A project directly (Status: ' + bFetchARes.status + ')');
    } else if (bFetchARes.ok) {
      console.error('❌ TENANT ISOLATION FAILED: User B could fetch User A project directly');
    } else {
      console.error('Unexpected error when User B fetched User A project:', bFetchARes.status);
    }

  } catch (error: any) {
    console.error('Test failed with error:', error);
  }
}

testTenantIsolation();
