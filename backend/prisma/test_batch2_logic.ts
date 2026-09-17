

const API_URL = 'http://localhost:5000/api';

async function main() {
  console.log('--- Batch 2 Logic Test ---');
  
  const login = async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) return null;
      return data.token;
    } catch (e) {
      return null;
    }
  };

  const adminToken = await login('admin@apexbuild.demo');
  if (!adminToken) {
    console.error('Failed to login admin');
    return;
  }

  // 1. Create Project
  let projectId = '';
  const projRes = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Logic Test Project',
      description: 'Test',
      status: 'PLANNING',
      budget: 100000
    })
  });
  const projData = await projRes.json();
  projectId = projData.id;
  console.log(projectId ? `✅ Project created: ${projectId}` : '❌ Project creation failed');

  // 2. Create Site
  let siteId = '';
  const siteRes = await fetch(`${API_URL}/projects/${projectId}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Logic Site',
      location: 'Site Location',
      status: 'ACTIVE'
    })
  });
  const siteData = await siteRes.json();
  siteId = siteData.id;
  console.log(siteId ? `✅ Site created: ${siteId}` : '❌ Site creation failed');

  // 3. Create WBS
  let wbsId = '';
  const wbsRes = await fetch(`${API_URL}/projects/${projectId}/wbs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Foundation Work'
    })
  });
  const wbsData = await wbsRes.json();
  wbsId = wbsData.id;
  console.log(wbsId ? `✅ WBS created: ${wbsId}` : `❌ WBS creation failed: ${JSON.stringify(wbsData)}`);

  // 4. Create Task 1
  let task1Id = '';
  const t1Res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Digging',
      description: 'Dig foundation',
      priority: 'HIGH',
      wbsElementId: wbsId
    })
  });
  const t1Data = await t1Res.json();
  task1Id = t1Data.id;
  console.log(task1Id ? `✅ Task 1 created: ${task1Id}` : `❌ Task 1 creation failed: ${JSON.stringify(t1Data)}`);

  // 5. Create Task 2
  let task2Id = '';
  const t2Res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Concrete',
      description: 'Pour concrete',
      priority: 'HIGH',
      wbsElementId: wbsId
    })
  });
  const t2Data = await t2Res.json();
  task2Id = t2Data.id;
  console.log(task2Id ? `✅ Task 2 created: ${task2Id}` : `❌ Task 2 creation failed: ${JSON.stringify(t2Data)}`);

  // 6. Test Task Update
  const updateRes = await fetch(`${API_URL}/projects/tasks/${task1Id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  });
  if (!updateRes.ok) {
    console.log(`❌ Task update failed with status ${updateRes.status}:`, await updateRes.text());
  } else {
    const updateData = await updateRes.json();
    console.log(updateData.status === 'IN_PROGRESS' ? `✅ Task updated to IN_PROGRESS` : `❌ Task update failed: ${JSON.stringify(updateData)}`);
  }

  console.log('--- Logic Test Complete ---');
}

main().catch(console.error);
