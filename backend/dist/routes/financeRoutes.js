"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financeController_1 = require("../controllers/financeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router({ mergeParams: true }); // mergeParams to access :projectId from parent if nested
// Require authentication for all finance routes
router.use(authMiddleware_1.authenticateToken);
// ==========================================
// Finance Summary
// ==========================================
// Allow viewing if they have finance.view OR are a client with client.dashboard.view (will be filtered at controller/service level)
router.get('/summary', (0, authMiddleware_1.requirePermission)('finance.view'), financeController_1.getFinanceSummary);
// ==========================================
// Invoices
// ==========================================
router.post('/invoices', (0, authMiddleware_1.requirePermission)('finance.manage'), financeController_1.createInvoice);
// ==========================================
// Payments
// ==========================================
// Payments are nested under invoices generally, but we'll put it here for simplicity or mount it under /api/invoices
// Here we expect it to be mounted at /api/projects/:projectId/finance
// Let's create an explicit invoice payment route
router.post('/invoices/:invoiceId/payments', (0, authMiddleware_1.requirePermission)('finance.manage'), financeController_1.createPayment);
// ==========================================
// Expenses
// ==========================================
router.post('/expenses', (0, authMiddleware_1.requirePermission)('finance.manage'), financeController_1.createExpense);
exports.default = router;
