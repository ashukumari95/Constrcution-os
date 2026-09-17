const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('Starting Audit...');
  try {
    const counts = {
      Organizations: await prisma.organization.count(),
      Users: await prisma.user.count(),
      Projects: await prisma.project.count(),
      Sites: await prisma.site.count(),
      WbsElements: await prisma.wbsElement.count(),
      Tasks: await prisma.task.count(),
      BoqItems: await prisma.boqItem.count(),
      Contractors: await prisma.contractor.count(),
      Workers: await prisma.worker.count(),
      LabourAttendance: await prisma.labourAttendance.count(),
      Materials: await prisma.material.count(),
      ProjectInventory: await prisma.projectInventory.count(),
      Vendors: await prisma.vendor.count(),
      PurchaseRequests: await prisma.purchaseRequest.count(),
      PurchaseOrders: await prisma.purchaseOrder.count(),
      PurchaseOrderItems: await prisma.purchaseOrderItem.count(),
      MaterialReceipts: await prisma.materialReceipt.count(),
      MaterialConsumption: await prisma.materialConsumption.count(),
      DPRs: await prisma.dailyProgressReport.count(),
      Issues: await prisma.issue.count(),
      IssueComments: await prisma.issueComment.count(),
      Documents: await prisma.projectDocument.count().catch(() => 'Model not found/error'),
      SitePhotos: await prisma.sitePhoto.count(),
      Budgets: await prisma.budget.count(),
      BudgetRevisions: await prisma.budgetRevision.count(),
      Subcontracts: await prisma.subcontract.count(),
      Expenses: await prisma.expense.count(),
      Invoices: await prisma.invoice.count(),
      Payments: await prisma.payment.count(),
      Notifications: await prisma.notification.count(),
      Risks: await prisma.projectRisk.count(),
      AuditLogs: await prisma.auditLog.count()
    };
    
    console.log(JSON.stringify(counts, null, 2));
  } catch(e) {
      console.error("Error during audit:", e);
  } finally {
      await prisma.$disconnect();
  }
}

audit();
