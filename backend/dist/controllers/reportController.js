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
exports.generateReport = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const generateReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        const { projectId, month, year } = req.query; // basic filters
        const orgId = req.user.organizationId;
        let projectWhere = { organizationId: orgId };
        // If projectId is provided, verify they have access to it
        if (projectId) {
            if (req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view')) {
                projectWhere = { id: projectId, organizationId: orgId, members: { some: { userId: req.user.id } } };
            }
            else {
                projectWhere = { id: projectId, organizationId: orgId };
            }
        }
        else {
            if (req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view')) {
                return res.status(403).json({ message: 'Clients must specify a project for reports.' });
            }
        }
        let reportData = { type, generatedAt: new Date(), generatedBy: req.user.email };
        switch (type) {
            case 'project-summary':
                const projects = yield prisma_1.default.project.findMany({
                    where: projectWhere,
                    include: {
                        tasks: true,
                        issues: { where: { status: 'OPEN' } }
                    }
                });
                reportData.projects = projects.map(p => {
                    const completedTasks = p.tasks.filter(t => t.status === 'COMPLETED').length;
                    return {
                        id: p.id,
                        name: p.name,
                        status: p.status,
                        contractValue: p.contractValue,
                        progress: p.tasks.length ? Math.round((completedTasks / p.tasks.length) * 100) : 0,
                        openIssues: p.issues.length
                    };
                });
                break;
            case 'monthly-progress':
                // simplified logic for specific month
                if (!projectId)
                    return res.status(400).json({ message: 'projectId required for monthly progress report' });
                // Verify project ownership
                const dprProj = yield prisma_1.default.project.findFirst({ where: projectWhere });
                if (!dprProj)
                    return res.status(403).json({ message: 'Unauthorized access to project' });
                const dprs = yield prisma_1.default.dailyProgressReport.findMany({
                    where: { projectId: projectId, status: 'APPROVED' },
                    orderBy: { date: 'asc' }
                });
                reportData.dprs = dprs;
                break;
            case 'cost-budget':
                if (req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view')) {
                    return res.status(403).json({ message: 'Unauthorized to view cost data.' });
                }
                const costProjects = yield prisma_1.default.project.findMany({
                    where: projectWhere,
                    include: { invoices: true, expenses: true, purchaseOrders: { include: { items: true } } }
                });
                reportData.financials = costProjects.map(p => {
                    const invoiced = p.invoices.reduce((acc, i) => acc + i.total, 0);
                    const expensed = p.expenses.reduce((acc, e) => acc + e.amount, 0);
                    const committed = p.purchaseOrders.reduce((sum, po) => {
                        return sum + po.items.reduce((s, item) => s + item.total, 0);
                    }, 0);
                    return {
                        id: p.id,
                        name: p.name,
                        budget: p.budget,
                        actualCost: invoiced + expensed,
                        committedCost: committed,
                        variance: (p.budget || 0) - (invoiced + expensed)
                    };
                });
                break;
            case 'boq':
                if (!projectId)
                    return res.status(400).json({ message: 'projectId required for BOQ report' });
                // Verify project ownership
                const boqProj = yield prisma_1.default.project.findFirst({ where: projectWhere });
                if (!boqProj)
                    return res.status(403).json({ message: 'Unauthorized access to project' });
                const boqItems = yield prisma_1.default.boqItem.findMany({ where: { projectId: projectId } });
                reportData.boq = boqItems;
                break;
            case 'procurement':
                if (req.user.role === 'CLIENT')
                    return res.status(403).json({ message: 'Unauthorized to view procurement data.' });
                const purchaseOrders = yield prisma_1.default.purchaseOrder.findMany({
                    where: { project: projectWhere },
                    include: { vendor: true, items: true }
                });
                reportData.purchaseOrders = purchaseOrders;
                break;
            case 'risk':
                const risks = yield prisma_1.default.projectRisk.findMany({
                    where: { project: projectWhere },
                    include: { project: { select: { name: true } } },
                    orderBy: { riskScore: 'desc' }
                });
                reportData.risks = risks;
                break;
            case 'labour':
                if (!projectId)
                    return res.status(400).json({ message: 'projectId required for labour report' });
                const labourLogs = yield prisma_1.default.labourAttendance.findMany({
                    where: { projectId: projectId },
                    include: { worker: { select: { firstName: true, lastName: true } } },
                    orderBy: { date: 'desc' }
                });
                reportData.labour = labourLogs;
                break;
            case 'dpr':
                if (!projectId)
                    return res.status(400).json({ message: 'projectId required for DPR report' });
                const projectDprs = yield prisma_1.default.dailyProgressReport.findMany({
                    where: { projectId: projectId },
                    orderBy: { date: 'desc' }
                });
                reportData.dprs = projectDprs;
                break;
            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }
        return res.json(reportData);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error generating report', error });
    }
});
exports.generateReport = generateReport;
