"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpense = exports.createPayment = exports.createInvoice = exports.getFinanceSummary = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditLogger_1 = require("../utils/auditLogger");
// ==========================================
// FINANCE SUMMARY
// ==========================================
const getFinanceSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const orgId = req.user.organizationId;
        // Verify project ownership
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(403).json({ message: 'Unauthorized access to project' });
        // 1. Original Budget (sum of originalAmounts)
        // 2. Current Budget (sum of currentAmounts)
        const budgets = yield prisma_1.default.budget.findMany({
            where: { projectId }
        });
        const originalBudget = budgets.reduce((acc, b) => acc + b.originalAmount, 0);
        const currentBudget = budgets.reduce((acc, b) => acc + b.currentAmount, 0);
        // 3. Committed Cost (Sum of POs + Subcontracts)
        const pos = yield prisma_1.default.purchaseOrder.findMany({
            where: { projectId, status: { in: ['APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'] } },
            include: { items: true }
        });
        const poTotal = pos.reduce((acc, po) => {
            const poSum = po.items.reduce((sum, item) => sum + item.total, 0);
            return acc + poSum;
        }, 0);
        const subcontracts = yield prisma_1.default.subcontract.findMany({
            where: { projectId, status: 'ACTIVE' }
        });
        const subcontractTotal = subcontracts.reduce((acc, sc) => acc + sc.committedValue, 0);
        const committedCost = poTotal + subcontractTotal;
        // 4. Invoiced Cost (Approved Invoices + Direct Expenses)
        // Note: We only count DIRECT expenses to avoid double-counting vendor invoices.
        const invoices = yield prisma_1.default.invoice.findMany({
            where: { projectId, status: { notIn: ['DRAFT', 'REJECTED'] } }
        });
        const invoicedCostFromInvoices = invoices.reduce((acc, inv) => acc + inv.total, 0);
        const expenses = yield prisma_1.default.expense.findMany({
            where: { projectId, type: 'DIRECT', status: { notIn: ['REJECTED'] } }
        });
        const invoicedCostFromExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const invoicedCost = invoicedCostFromInvoices + invoicedCostFromExpenses;
        // 5. Paid Cost (Completed Payments + Paid Direct Expenses)
        const payments = yield prisma_1.default.payment.findMany({
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
        const isClient = req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view');
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching finance summary', error });
    }
});
exports.getFinanceSummary = getFinanceSummary;
// ==========================================
// INVOICES & PAYMENTS
// ==========================================
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const orgId = req.user.organizationId;
        // Verify project ownership
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(403).json({ message: 'Unauthorized access to project' });
        const { invoiceNumber, vendorId, date, dueDate, subtotal, tax } = req.body;
        const total = parseFloat(subtotal) + parseFloat(tax);
        const invoice = yield prisma_1.default.invoice.create({
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
        yield (0, auditLogger_1.logAudit)('CREATE', 'Invoice', invoice.id, req.user.id, req.user.organizationId, JSON.stringify({ total }));
        return res.status(201).json(invoice);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating invoice', error });
    }
});
exports.createInvoice = createInvoice;
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceId = req.params.invoiceId;
        const orgId = req.user.organizationId;
        const { amount, paymentDate, referenceNumber, paymentMethod, notes } = req.body;
        const paymentAmount = parseFloat(amount);
        // Use a Prisma transaction to ensure payment records are the source of truth and no overpayments occur
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const invoice = yield tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { payments: true, project: { select: { organizationId: true } } }
            });
            if (!invoice)
                throw new Error('Invoice not found');
            const { getAccessibleProject } = require('../utils/projectAccess');
            const invoiceProject = yield getAccessibleProject(invoice.projectId, req.user);
            if (!invoiceProject)
                throw new Error('Unauthorized access to invoice project');
            const authoritativeAmountPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
            const balanceDue = invoice.total - authoritativeAmountPaid;
            // 2. Validate against overpayment
            if (paymentAmount > balanceDue) {
                throw new Error(`Payment amount (${paymentAmount}) exceeds balance due (${balanceDue})`);
            }
            // 3. Create the payment
            const payment = yield tx.payment.create({
                data: {
                    invoiceId,
                    amount: paymentAmount,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    referenceNumber,
                    paymentMethod,
                    notes,
                    createdById: req.user.id
                }
            });
            // 4. Update the cached amountPaid and status on the Invoice
            const newAmountPaid = authoritativeAmountPaid + paymentAmount;
            const newStatus = (newAmountPaid >= invoice.total) ? 'PAID' : 'PARTIALLY_PAID';
            yield tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus
                }
            });
            return payment;
        }));
        yield (0, auditLogger_1.logAudit)('CREATE', 'Payment', result.id, req.user.id, req.user.organizationId, JSON.stringify({ amount: paymentAmount }));
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.message && error.message.includes('exceeds balance due')) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error creating payment', error: error.message || error });
    }
});
exports.createPayment = createPayment;
// ==========================================
// DIRECT EXPENSES
// ==========================================
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const orgId = req.user.organizationId;
        // Verify project ownership
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(403).json({ message: 'Unauthorized access to project' });
        const { title, amount, date, category, type, vendorId, receiptUrl } = req.body;
        const expense = yield prisma_1.default.expense.create({
            data: {
                projectId,
                title,
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date(),
                category,
                type: type || 'DIRECT',
                vendorId,
                receiptUrl,
                recordedById: req.user.id,
                status: 'PENDING_APPROVAL'
            }
        });
        yield (0, auditLogger_1.logAudit)('CREATE', 'Expense', expense.id, req.user.id, req.user.organizationId, JSON.stringify({ amount }));
        return res.status(201).json(expense);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating expense', error });
    }
});
exports.createExpense = createExpense;
