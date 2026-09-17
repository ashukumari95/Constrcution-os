import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roles = [
  { name: 'SUPER_ADMIN', permissions: ['all'] },
  { name: 'COMPANY_ADMIN', permissions: ['dashboard.view', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'users.view', 'users.manage', 'settings.manage'] },
  { name: 'PROJECT_MANAGER', permissions: ['dashboard.view', 'projects.view', 'schedule.view', 'schedule.create', 'tasks.view', 'tasks.create', 'tasks.assign', 'issues.view', 'issues.create', 'issues.resolve', 'reports.view', 'finance.view', 'purchase.approve', 'materials.view', 'labour.view', 'contractors.view'] },
  { name: 'SITE_ENGINEER', permissions: ['dashboard.view', 'projects.view', 'tasks.view', 'tasks.complete', 'labour.view', 'labour.create', 'materials.view', 'dpr.view', 'dpr.create', 'issues.view', 'issues.create', 'purchase.create'] },
  { name: 'PROCUREMENT_MANAGER', permissions: ['dashboard.view', 'materials.view', 'materials.create', 'materials.manage', 'inventory.view', 'inventory.manage', 'purchase.view', 'purchase.create', 'purchase.approve', 'contractors.view'] },
  { name: 'FINANCE_MANAGER', permissions: ['dashboard.view', 'finance.view', 'finance.create', 'finance.approve', 'reports.view', 'reports.export'] },
  { name: 'CONTRACTOR', permissions: ['projects.view', 'tasks.view', 'tasks.complete', 'materials.view'] },
  { name: 'CLIENT', permissions: ['dashboard.view', 'projects.view', 'reports.view', 'documents.view'] },
  { name: 'VIEWER', permissions: ['dashboard.view', 'projects.view'] },
];

const vendorCategories = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Bricks/Blocks', 'Electrical', 'Plumbing', 'Paint', 'Flooring', 'Equipment'];
const workerNames = ['Rajesh Kumar', 'Amit Singh', 'Suresh Patel', 'Ramesh Yadav', 'Dinesh Sharma', 'Manoj Verma', 'Prakash Tiwari', 'Sandeep Mishra', 'Vikram Singh', 'Anil Gupta', 'Sunil Das', 'Ajay Kumar', 'Vijay Rajput', 'Karan Patel', 'Ravi Shankar', 'Pramod Kumar', 'Sanjay Yadav', 'Naveen Sharma', 'Rohit Verma', 'Deepak Singh'];

async function cleanDatabase() {
  console.log('Cleaning database...');
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}`, error);
      }
    }
  }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedOrganization(orgName: string, domain: string, defaultPasswordHash: string) {
  console.log(`\n--- Seeding Organization: ${orgName} ---`);
  const org = await prisma.organization.create({ data: { name: orgName } });

  const roleMap: Record<string, string> = {};
  for (const roleDef of roles) {
    const role = await prisma.role.create({
      data: { name: roleDef.name, permissions: JSON.stringify(roleDef.permissions), organizationId: org.id }
    });
    roleMap[roleDef.name] = role.id;
  }

  const users = [
    { email: `admin@${domain}`, firstName: 'Admin', lastName: 'User', role: 'COMPANY_ADMIN' },
    { email: `pm1@${domain}`, firstName: 'Alice', lastName: 'Manager', role: 'PROJECT_MANAGER' },
    { email: `pm2@${domain}`, firstName: 'Bob', lastName: 'Manager', role: 'PROJECT_MANAGER' },
    { email: `engineer1@${domain}`, firstName: 'Charlie', lastName: 'Engineer', role: 'SITE_ENGINEER' },
    { email: `engineer2@${domain}`, firstName: 'David', lastName: 'Engineer', role: 'SITE_ENGINEER' },
    { email: `procurement@${domain}`, firstName: 'Eva', lastName: 'Buyer', role: 'PROCUREMENT_MANAGER' },
    { email: `finance@${domain}`, firstName: 'Frank', lastName: 'Accountant', role: 'FINANCE_MANAGER' },
    { email: `contractor@${domain}`, firstName: 'George', lastName: 'Builder', role: 'CONTRACTOR' },
    { email: `client@${domain}`, firstName: 'Helen', lastName: 'Client', role: 'CLIENT' }
  ];

  const userMap: Record<string, any> = {};
  for (const userDef of users) {
    const u = await prisma.user.create({
      data: {
        email: userDef.email, firstName: userDef.firstName, lastName: userDef.lastName,
        passwordHash: defaultPasswordHash, organizationId: org.id, roleId: roleMap[userDef.role]
      }
    });
    userMap[userDef.role] = u;
    if (userDef.email.startsWith('pm1')) userMap['PM1'] = u;
    if (userDef.email.startsWith('pm2')) userMap['PM2'] = u;
    if (userDef.email.startsWith('engineer1')) userMap['SE1'] = u;
    if (userDef.email.startsWith('engineer2')) userMap['SE2'] = u;
  }

  // Projects
  const p1 = await prisma.project.create({
    data: {
      name: `${orgName} Tower Phase 1`, projectCode: `PRJ-01`, description: 'Commercial 10-story building',
      status: 'ACTIVE', budget: 150000000, contractValue: 180000000, projectType: 'Commercial', client: 'City Corp',
      location: 'Downtown Center', startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      plannedCompletion: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      organizationId: org.id, projectManagerId: userMap['PM1'].id
    }
  });

  const p2 = await prisma.project.create({
    data: {
      name: `${orgName} Residential Villas`, projectCode: `PRJ-02`, status: 'ACTIVE',
      budget: 50000000, contractValue: 60000000, projectType: 'Residential', client: 'Private Investors',
      location: 'Westside Suburbs', startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      plannedCompletion: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
      organizationId: org.id, projectManagerId: userMap['PM2'].id
    }
  });

  // Sites
  const site1 = await prisma.site.create({ data: { name: 'Block A', location: 'North Wing', projectId: p1.id, siteManagerId: userMap['SE1'].id } });
  const site2 = await prisma.site.create({ data: { name: 'Block B', location: 'South Wing', projectId: p1.id, siteManagerId: userMap['SE2'].id } });
  const site3 = await prisma.site.create({ data: { name: 'Villa Area 1', location: 'Plots 1-10', projectId: p2.id, siteManagerId: userMap['SE1'].id } });

  // WBS & Tasks
  const wbs1 = await prisma.wbsElement.create({ data: { name: 'Site Prep', projectId: p1.id, progress: 100 } });
  const wbs2 = await prisma.wbsElement.create({ data: { name: 'Foundation', projectId: p1.id, progress: 50 } });
  await prisma.task.create({ data: { title: 'Clear debris', status: 'COMPLETED', projectId: p1.id, wbsElementId: wbs1.id, assigneeId: userMap['SE1'].id, dueDate: new Date() } });
  await prisma.task.create({ data: { title: 'Excavation', status: 'IN_PROGRESS', projectId: p1.id, wbsElementId: wbs2.id, assigneeId: userMap['SE1'].id, dueDate: new Date(Date.now() + 5*86400000) } });

  // BOQ
  const boqData = [
    { itemCode: 'EW-01', description: 'Earthwork in excavation', category: 'Earthwork', unit: 'Cum', quantity: 5000, rate: 250 },
    { itemCode: 'CC-01', description: 'PCC 1:4:8 in foundation', category: 'Concrete', unit: 'Cum', quantity: 500, rate: 4500 },
    { itemCode: 'ST-01', description: 'TMT Steel Reinforcement', category: 'Reinforcement', unit: 'MT', quantity: 150, rate: 65000 },
    { itemCode: 'BW-01', description: 'Brickwork in cement mortar', category: 'Masonry', unit: 'Sqm', quantity: 2000, rate: 850 },
  ];
  for (const boq of boqData) {
    await prisma.boqItem.create({ data: { ...boq, estimatedAmount: boq.quantity * boq.rate, projectId: p1.id } });
  }

  // Vendors
  const vendors = [];
  for (let i = 1; i <= 10; i++) {
    const category = randChoice(vendorCategories);
    const vendor = await prisma.vendor.create({
      data: {
        name: `${orgName} ${category} Supplier ${i}`,
        contactPerson: `Vendor Contact ${i}`, email: `vendor${i}@${domain}`,
        phone: `555-020${i}`, performance: randInt(70, 100),
        organizationId: org.id
      }
    });
    vendors.push(vendor);
  }

  // Materials
  const materials = [];
  const matList = [
    { name: 'Cement 53 Grade', code: 'MAT-CEM-01', unit: 'Bags', category: 'Cement' },
    { name: 'TMT Steel 8mm', code: 'MAT-STL-01', unit: 'MT', category: 'Steel' },
    { name: 'River Sand', code: 'MAT-SND-01', unit: 'Cum', category: 'Sand' },
    { name: '20mm Aggregate', code: 'MAT-AGG-01', unit: 'Cum', category: 'Aggregate' },
    { name: 'Red Bricks', code: 'MAT-BRK-01', unit: 'Nos', category: 'Bricks/Blocks' }
  ];
  for (const m of matList) {
    materials.push(await prisma.material.create({ data: { ...m, organizationId: org.id } }));
  }

  // Rates mapped by category
  const matRates: Record<string, number> = {
    'Cement': 400, 'Steel': 65000, 'Sand': 1200, 'Aggregate': 1000, 'Bricks/Blocks': 8
  };

  // Procurement & Inventory Workflow
  for (const mat of materials) {
    const matRate = matRates[mat.category] || 100;
    
    // 1. Purchase Request
    const pr = await prisma.purchaseRequest.create({
      data: {
        prNumber: `PR-${orgName.substring(0,3)}-${randInt(100,999)}`, projectId: p1.id, siteId: site1.id,
        requestedById: userMap['SE1'].id, status: 'APPROVED',
        items: {
          create: [{ materialId: mat.id, quantity: randInt(100, 1000), expectedDate: new Date(Date.now() + 7*86400000) }]
        }
      }
    });
    
    // 2. Purchase Order
    const vendor = vendors.find(v => v.name.includes(mat.category)) || vendors[0];
    const poQty = randInt(100, 1000);
    const poAmount = poQty * matRate;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${orgName.substring(0,3)}-${randInt(100,999)}`, projectId: p1.id, vendorId: vendor.id,
        status: randChoice(['PENDING_APPROVAL', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED']),
        expectedDelivery: new Date(),
        items: {
          create: [{ materialId: mat.id, quantity: poQty, rate: matRate, total: poAmount }]
        }
      },
      include: { items: true }
    });

    // 3. Material Receipt
    let receivedQty = 0;
    if (po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') {
      receivedQty = po.status === 'RECEIVED' ? poQty : Math.floor(poQty / 2);
      await prisma.materialReceipt.create({
        data: {
          receiptNumber: `GRN-${orgName.substring(0,3)}-${randInt(100,999)}`, poId: po.id, projectId: p1.id,
          receivedById: userMap['SE1'].id,
          items: {
            create: [{ materialId: mat.id, quantity: receivedQty }]
          }
        }
      });
    }

    // 4. Consumption
    let consumedQty = 0;
    if (receivedQty > 0) {
      consumedQty = Math.floor(receivedQty * (randInt(20, 90) / 100)); // Consume 20-90% of received
      await prisma.materialConsumption.create({
        data: {
          projectId: p1.id, siteId: site1.id, materialId: mat.id, quantity: consumedQty,
          date: new Date(), usedById: userMap['SE1'].id
        }
      });
    }

    // 5. Inventory
    const requiredQty = poQty * 2;
    const available = receivedQty - consumedQty;
    const reorderLevel = available + randInt(-50, 100); 
    await prisma.projectInventory.create({
      data: {
        projectId: p1.id, materialId: mat.id,
        requiredQuantity: requiredQty, receivedQuantity: receivedQty, consumedQuantity: consumedQty,
        reorderLevel: reorderLevel
      }
    });

    // 6. Finance (Invoice & Payment)
    if (receivedQty > 0) {
      const invAmount = receivedQty * matRate;
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${vendor.id.substring(0,4)}-${randInt(100,999)}`, projectId: p1.id,
          vendorId: vendor.id, subtotal: invAmount, total: invAmount, amountPaid: 0,
          status: randChoice(['PENDING', 'PARTIALLY_PAID', 'PAID']),
          dueDate: new Date(Date.now() + 30*86400000), date: new Date()
        }
      });

      if (invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID') {
        const payAmount = invoice.status === 'PAID' ? invAmount : Math.floor(invAmount / 2);
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id, amount: payAmount,
            paymentDate: new Date(), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'UTR123456',
            createdById: userMap['FINANCE_MANAGER'].id
          }
        });
        
        await prisma.invoice.update({
          where: { id: invoice.id }, data: { amountPaid: payAmount }
        });
      }
    }
  }

  // Contractors & Labour
  const contractors = [];
  for (let i = 1; i <= 3; i++) {
    const contractor = await prisma.contractor.create({
      data: {
        companyName: `${orgName} Contractor ${i}`, contactPerson: `Manager ${i}`,
        email: `contractor${i}@${domain}`, phone: `555-030${i}`,
        contractValue: randInt(1000000, 5000000), status: 'ACTIVE',
        organizationId: org.id, projects: { connect: [{ id: p1.id }] }
      }
    });
    contractors.push(contractor);
  }

  const workers = [];
  for (let i = 0; i < 20; i++) {
    const names = workerNames[i].split(' ');
    workers.push(await prisma.worker.create({
      data: {
        firstName: names[0], lastName: names[1] || '',
        type: randChoice(['SKILLED', 'UNSKILLED', 'SUPERVISOR']),
        category: randChoice(['Mason', 'Carpenter', 'Bar Bender', 'Helper']),
        dailyRate: randInt(400, 1200),
        contractorId: randChoice(contractors).id, projectId: p1.id, organizationId: org.id
      }
    }));
  }

  // Attendance & DPR
  for (let i = 0; i < 5; i++) {
    const dprDate = new Date(Date.now() - i * 86400000); // Past 5 days
    
    // Attendance
    let presentCount = 0;
    for (const w of workers) {
      const status = randChoice(['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'HALF_DAY']);
      if (status === 'PRESENT') presentCount++;
      await prisma.labourAttendance.create({
        data: {
          workerId: w.id, projectId: p1.id, siteId: site1.id, date: dprDate,
          status, overtimeHours: status === 'PRESENT' ? randChoice([0, 0, 2, 4]) : 0
        }
      });
    }

    // DPR
    await prisma.dailyProgressReport.create({
      data: {
        projectId: p1.id, siteId: site1.id, date: dprDate,
        status: i === 0 ? 'DRAFT' : (i === 1 ? 'SUBMITTED' : 'APPROVED'),
        workCompleted: `Completed casting of column C${i+1} and brickwork for wall W${i+1}.`,
        manpowerCount: presentCount,
        safetyObservations: 'All PPE compliance checked. Toolbox talk conducted.',
        issues: i === 2 ? 'Slight delay due to heavy rain in the afternoon.' : 'No major issues.',
        nextDayPlan: `Start shuttering for slab S${i+2}.`,
        preparedById: userMap['SE1'].id,
        approvedById: i === 0 ? null : userMap['PM1'].id
      }
    });
  }

  // Issues and Risks
  const issueCategories = ['Schedule', 'Cost', 'Material', 'Labour', 'Quality', 'Safety'];
  for (let i = 0; i < 5; i++) {
    await prisma.issue.create({
      data: {
        title: `Issue regarding ${randChoice(issueCategories)} on site`,
        description: 'Detailed description of the problem encountered on site...',
        status: randChoice(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
        priority: randChoice(['LOW', 'MEDIUM', 'HIGH']),
        type: randChoice(issueCategories).toUpperCase(),
        projectId: p1.id, siteId: site1.id,
        reportedById: userMap['SE1'].id, assignedToId: userMap['PM1'].id
      }
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.projectRisk.create({
      data: {
        title: `Risk of material shortage - ${randChoice(['Cement', 'Steel'])}`,
        description: 'Market shortage might cause delays',
        category: 'MATERIAL', probability: randChoice([2.0, 3.0, 4.0]),
        impact: randChoice([3.0, 4.0, 5.0]), status: randChoice(['OPEN', 'MITIGATED']),
        mitigationPlan: 'Identify secondary vendors immediately.', severity: 'HIGH',
        projectId: p1.id, ownerId: userMap['PM1'].id, reportedById: userMap['SE1'].id
      }
    });
  }

  // Budget
  await prisma.budget.create({
    data: {
      projectId: p1.id, category: 'Materials', originalAmount: 100000000,
      currentAmount: 100000000
    }
  });
  await prisma.budget.create({
    data: {
      projectId: p1.id, category: 'Labour', originalAmount: 50000000,
      currentAmount: 50000000
    }
  });

  console.log(`Finished Seeding Organization: ${orgName}`);
}

async function main() {
  await cleanDatabase();
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await seedOrganization('Apex Builders', 'apexbuild.demo', passwordHash);
  await seedOrganization('Zenith Construction', 'zenithbuild.demo', passwordHash);
  
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
