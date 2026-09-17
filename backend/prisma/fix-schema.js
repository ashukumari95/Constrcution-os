const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const projectRelations = `
  // Phase 3 extensions
  contractors Contractor[] @relation("ContractorProjects")
  workers Worker[]
  labourAttendances LabourAttendance[]
  inventories ProjectInventory[]
  purchaseRequests PurchaseRequest[]
  purchaseOrders PurchaseOrder[]
  materialReceipts MaterialReceipt[]
  materialConsumptions MaterialConsumption[]
  dailyProgressReports DailyProgressReport[]
  issues Issue[]
  budgets Budget[]
  expenses Expense[]
  invoices Invoice[]
`;

const siteRelations = `
  // Phase 3 extensions
  labourAttendances LabourAttendance[]
  purchaseRequests PurchaseRequest[]
  materialConsumptions MaterialConsumption[]
  dailyProgressReports DailyProgressReport[]
  issues Issue[]
`;

const orgRelations = `
  // Phase 3 extensions
  contractors Contractor[]
  workers Worker[]
  materials Material[]
  vendors Vendor[]
`;

// Insert into Project
schema = schema.replace(
  /  boqItems       BoqItem\[\]\n\}/,
  `  boqItems       BoqItem[]\n${projectRelations}}`
);

// Insert into Site
schema = schema.replace(
  /  project        Project      @relation\(fields: \[projectId\], references: \[id\]\)\n\}/,
  `  project        Project      @relation(fields: [projectId], references: [id])\n${siteRelations}}`
);

// Insert into Organization
schema = schema.replace(
  /  auditLogs AuditLog\[\]\n\}/,
  `  auditLogs AuditLog[]\n${orgRelations}}`
);

// Also we need to clean up whatever garbage `prisma format` added, if any. 
// It probably added `Contractor Contractor? @relation(...)` and `contractorId String?` to Project. 
schema = schema.replace(/  Contractor          Contractor\?           @relation\(fields: \[contractorId\], references: \[id\]\)\n  contractorId        String\?\n/g, '');


fs.writeFileSync(schemaPath, schema);
console.log('Schema fixed');
