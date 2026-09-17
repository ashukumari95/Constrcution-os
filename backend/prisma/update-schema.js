const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
const extensionPath = path.join(__dirname, 'schema_extension.prisma');

let schema = fs.readFileSync(schemaPath, 'utf8');
const extension = fs.readFileSync(extensionPath, 'utf8');

const backRelations = `
  contractorId   String?
  contractor     Contractor?  @relation("ContractorUsers", fields: [contractorId], references: [id])
  
  // Procurement & Finance
  requestedPRs   PurchaseRequest[] @relation("PRRequester")
  approvedPRs    PurchaseRequest[] @relation("PRApprover")
  materialReceipts MaterialReceipt[] @relation("MaterialReceiver")
  materialConsumptions MaterialConsumption[] @relation("MaterialConsumer")
  preparedDPRs   DailyProgressReport[] @relation("DPRPreparer")
  reportedIssues Issue[] @relation("IssueReporter")
  assignedIssues Issue[] @relation("IssueAssignee")
  recordedExpenses Expense[] @relation("ExpenseRecorder")
`;

// Insert backRelations right before the closing brace of the User model
schema = schema.replace(
  /  taskUploads     TaskAttachment\[\]\n\}/,
  `  taskUploads     TaskAttachment[]\n${backRelations}}`
);

// Append the extension
schema = schema + '\n' + extension;

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
