import express from 'express';
import { getFinanceSummary, createInvoice, createPayment, createExpense } from '../controllers/financeController';
import { authenticateToken, requirePermission } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId from parent if nested

// Require authentication for all finance routes
router.use(authenticateToken);

// ==========================================
// Finance Summary
// ==========================================
// Allow viewing if they have finance.view OR are a client with client.dashboard.view (will be filtered at controller/service level)
router.get('/summary', requirePermission('finance.view'), getFinanceSummary);

// ==========================================
// Invoices
// ==========================================
router.post('/invoices', requirePermission('finance.manage'), createInvoice);

// ==========================================
// Payments
// ==========================================
// Payments are nested under invoices generally, but we'll put it here for simplicity or mount it under /api/invoices
// Here we expect it to be mounted at /api/projects/:projectId/finance
// Let's create an explicit invoice payment route
router.post('/invoices/:invoiceId/payments', requirePermission('finance.manage'), createPayment);

// ==========================================
// Expenses
// ==========================================
router.post('/expenses', requirePermission('finance.manage'), createExpense);

export default router;
