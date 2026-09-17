import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

// ==========================================
// FINANCE SUMMARY
// ==========================================
export const getFinanceSummary = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const orgId = req.user!.organizationId;

    // Verify project ownership
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(403).json({ message: 'Unauthorized access to project' });

    // 1. Original Budget (sum of originalAmounts)
    // 2. Current Budget (sum of currentAmounts)
    const budgets = await prisma.budget.findMany({
      where: { projectId }
    });
    const originalBudget = budgets.reduce((acc, b) => acc + b.originalAmount, 0);
    const currentBudget = budgets.reduce((acc, b) => acc + b.currentAmount, 0);

    // 3. Committed Cost (Sum of POs + Subcontracts)
    const pos = await prisma.purchaseOrder.findMany({
      where: { projectId, status: { in: ['APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'] } },
      include: { items: true }
    });
    const poTotal = pos.reduce((acc, po) => {
      const poSum = po.items.reduce((sum, item) => sum + item.total, 0);
      return acc + poSum;
    }, 0);

    const subcontracts = await prisma.subcontract.findMany({
      where: { projectId, status: 'ACTIVE' }
    });
    const subcontractTotal = subcontracts.reduce((acc, sc) => acc + sc.committedValue, 0);
    
    const committedCost = poTotal + subcontractTotal;

    // 4. Invoiced Cost (Approved Invoices + Direct Expenses)
    // Note: We only count DIRECT expenses to avoid double-counting vendor invoices.
    const invoices = await prisma.invoice.findMany({
      where: { projectId, status: { notIn: ['DRAFT', 'REJECTED'] } }
    });
    const invoicedCostFromInvoices = invoices.reduce((acc, inv) => acc + inv.total, 0);

    const expenses = await prisma.expense.findMany({
      where: { projectId, type: 'DIRECT', status: { notIn: ['REJECTED'] } }
    });
    const invoicedCostFromExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    const invoicedCost = invoicedCostFromInvoices + invoicedCostFromExpenses;

    // 5. Paid Cost (Completed Payments + Paid Direct Expenses)
    const payments = await prisma.payment.findMany({
      where: { invoice: { projectId } }
    });
    const paidCostFromPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    // Assuming all 'APPROVED' direct expenses are paid out of pocket/petty cash
    const paidCostFromExpenses = expenses.filter(e => e.status === 'APPROVED').reduce((acc, exp) => acc + exp.amount, 0);
    
    const paidCost = paidCostFromPayments + paidCostFromExpenses;

    // 6. Outstanding Payables
    const outstandingPayables = invoicedCost - paidCost;

    // 7. Budget Variance
    const budgetVariance = currentBudget - invoicedCost; // Can also use committedCost or forecast depending on methodology, but invoiced vs budget is standard.

    const isClient = req.user!.role === 'CLIENT' || req.user!.permissions.includes('client.dashboard.view');

    if (isClient) {
      // Strip all internal vendor invoices, subcontracts, and direct expenses
      return res.json({
        originalBudget,
        currentBudget,
        invoicedCost, // Depending on if we want client to see this. We'll leave the aggregated sums for now.
        paidCost,
        outstandingPayables,
        budgetVariance,
        // OMITting budgets, subcontracts, expenses, invoices array to hide vendor details
        budgets: [],
        subcontracts: [],
        expenses: [],
        invoices: []
      });
    }

    return res.json({
      originalBudget,
      currentBudget,
      committedCost,
      invoicedCost,
      paidCost,
      outstandingPayables,
      budgetVariance,
      budgets,
      subcontracts,
      expenses,
      invoices
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching finance summary', error });
  }
};

// ==========================================
// INVOICES & PAYMENTS
// ==========================================
export const createInvoice = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const orgId = req.user!.organizationId;

    // Verify project ownership
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(403).json({ message: 'Unauthorized access to project' });

    const { invoiceNumber, vendorId, date, dueDate, subtotal, tax } = req.body;

    const total = parseFloat(subtotal) + parseFloat(tax);

    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        vendorId,
        invoiceNumber,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax),
        total,
        amountPaid: 0,
        status: 'SUBMITTED'
      }
    });

    await logAudit('CREATE', 'Invoice', invoice.id, req.user!.id, req.user!.organizationId, JSON.stringify({ total }));

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating invoice', error });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const invoiceId = req.params.invoiceId as string;
    const orgId = req.user!.organizationId;
    const { amount, paymentDate, referenceNumber, paymentMethod, notes } = req.body;
    const paymentAmount = parseFloat(amount);

    // Use a Prisma transaction to ensure payment records are the source of truth and no overpayments occur
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true, project: { select: { organizationId: true } } }
      });

      if (!invoice) throw new Error('Invoice not found');
      const { getAccessibleProject } = require('../utils/projectAccess');
      const invoiceProject = await getAccessibleProject(invoice.projectId, req.user!);
      if (!invoiceProject) throw new Error('Unauthorized access to invoice project');

      const authoritativeAmountPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
      const balanceDue = invoice.total - authoritativeAmountPaid;

      // 2. Validate against overpayment
      if (paymentAmount > balanceDue) {
        throw new Error(`Payment amount (${paymentAmount}) exceeds balance due (${balanceDue})`);
      }

      // 3. Create the payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          referenceNumber,
          paymentMethod,
          notes,
          createdById: req.user!.id
        }
      });

      // 4. Update the cached amountPaid and status on the Invoice
      const newAmountPaid = authoritativeAmountPaid + paymentAmount;
      const newStatus = (newAmountPaid >= invoice.total) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus
        }
      });

      return payment;
    });

    await logAudit('CREATE', 'Payment', result.id, req.user!.id, req.user!.organizationId, JSON.stringify({ amount: paymentAmount }));

    return res.status(201).json(result);
  } catch (error: any) {
    if (error.message && error.message.includes('exceeds balance due')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Error creating payment', error: error.message || error });
  }
};

// ==========================================
// DIRECT EXPENSES
// ==========================================
export const createExpense = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const orgId = req.user!.organizationId;

    // Verify project ownership
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(403).json({ message: 'Unauthorized access to project' });

    const { title, amount, date, category, type, vendorId, receiptUrl } = req.body;

    const expense = await prisma.expense.create({
      data: {
        projectId,
        title,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        category,
        type: type || 'DIRECT',
        vendorId,
        receiptUrl,
        recordedById: req.user!.id,
        status: 'PENDING_APPROVAL'
      }
    });

    await logAudit('CREATE', 'Expense', expense.id, req.user!.id, req.user!.organizationId, JSON.stringify({ amount }));

    return res.status(201).json(expense);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating expense', error });
  }
};
