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
exports.getExecutiveDashboard = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = req.user.organizationId;
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: orgId };
        // KPIs
        const totalProjects = yield prisma_1.default.project.count({ where: orgWhere });
        const activeProjects = yield prisma_1.default.project.count({ where: Object.assign(Object.assign({}, orgWhere), { status: 'ACTIVE' }) });
        const allTasks = yield prisma_1.default.task.count({ where: { project: orgWhere } });
        const completedTasks = yield prisma_1.default.task.count({ where: { project: orgWhere, status: 'COMPLETED' } });
        const taskProgress = allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;
        const projectsList = yield prisma_1.default.project.findMany({
            where: orgWhere,
            include: { tasks: true }
        });
        const totalBudget = projectsList.reduce((sum, p) => sum + (p.budget || 0), 0);
        const openIssues = yield prisma_1.default.issue.count({ where: { project: orgWhere, status: 'OPEN' } });
        const criticalIssues = yield prisma_1.default.issue.count({ where: { project: orgWhere, status: 'OPEN', priority: 'HIGH' } });
        // Project Progress
        const projectProgress = projectsList.map(p => {
            const pTasks = p.tasks.length;
            const pCompleted = p.tasks.filter(t => t.status === 'COMPLETED').length;
            const progress = pTasks > 0 ? Math.round((pCompleted / pTasks) * 100) : 0;
            let status = 'On Track';
            if (progress < 20 && p.status === 'ACTIVE')
                status = 'Delayed';
            if (progress > 90)
                status = 'Near Completion';
            return {
                id: p.id,
                name: p.name,
                progress,
                status
            };
        }).sort((a, b) => b.progress - a.progress).slice(0, 5);
        // Action Items (Pending Approvals, Recent Issues)
        const pendingDprs = yield prisma_1.default.dailyProgressReport.findMany({
            where: { project: { organizationId: orgId }, status: 'SUBMITTED' },
            include: { project: { select: { name: true } } },
            take: 3,
            orderBy: { createdAt: 'desc' }
        });
        const recentIssues = yield prisma_1.default.issue.findMany({
            where: { project: { organizationId: orgId }, status: 'OPEN' },
            include: { project: { select: { name: true } } },
            take: 2,
            orderBy: { createdAt: 'desc' }
        });
        const actionItems = [
            ...pendingDprs.map(dpr => ({
                id: `dpr-${dpr.id}`,
                title: `DPR Submission - ${dpr.project.name}`,
                type: 'Approval',
                time: dpr.createdAt,
                urgent: false
            })),
            ...recentIssues.map(issue => ({
                id: `issue-${issue.id}`,
                title: `Issue: ${issue.title}`,
                type: 'Review',
                time: issue.createdAt,
                urgent: issue.priority === 'HIGH'
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        return res.json({
            activeProjects,
            totalProjects,
            totalBudget,
            taskProgress,
            openIssues,
            criticalIssues,
            projectProgress,
            actionItems
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
});
exports.getDashboardStats = getDashboardStats;
const getExecutiveDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = req.user.organizationId;
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: orgId };
        const projectsList = yield prisma_1.default.project.findMany({
            where: Object.assign(Object.assign({}, orgWhere), { status: 'ACTIVE' }),
            include: {
                tasks: true,
                issues: { where: { status: 'OPEN' } },
                invoices: { where: { status: { not: 'REJECTED' } }, include: { payments: true } },
                expenses: true,
                risks: { where: { status: 'OPEN' } },
                purchaseOrders: { where: { status: { in: ['OPEN', 'APPROVED', 'ORDERED'] } }, include: { items: true } }
            }
        });
        const totalActiveProjects = projectsList.length;
        const totalProjectValue = projectsList.reduce((sum, p) => sum + (p.contractValue || 0), 0);
        const portfolioBudget = projectsList.reduce((sum, p) => sum + (p.budget || 0), 0);
        let totalActualCost = 0;
        let delayedProjectsCount = 0;
        let portfolioProgressSum = 0;
        let procurementExposure = 0;
        const delayedProjects = [];
        const materialRisks = [];
        const criticalIssues = [];
        projectsList.forEach(p => {
            // Cost: use payments as source of truth for paid invoices
            const invoicePaid = p.invoices.reduce((sum, i) => sum + i.payments.reduce((pSum, pay) => pSum + pay.amount, 0), 0);
            const expensed = p.expenses.reduce((sum, e) => sum + e.amount, 0);
            // Assuming expenses are separate standalone items not double counting invoices here
            totalActualCost += (invoicePaid + expensed);
            // Procurement
            const poExposure = p.purchaseOrders.reduce((sum, po) => {
                const poTotal = po.items.reduce((s, item) => s + item.total, 0);
                return sum + poTotal;
            }, 0);
            procurementExposure += poExposure;
            // Progress & Schedule
            const pTasks = p.tasks.length;
            const pCompleted = p.tasks.filter(t => t.status === 'COMPLETED').length;
            const pOverdue = p.tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()).length;
            const progress = pTasks > 0 ? (pCompleted / pTasks) * 100 : 0;
            portfolioProgressSum += progress;
            if (pOverdue > 0 || (progress < 20)) { // simple delayed logic
                delayedProjectsCount++;
                delayedProjects.push({ id: p.id, name: p.name, progress: Math.round(progress), overdueTasks: pOverdue });
            }
            // Risks
            const highRisks = p.risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
            highRisks.forEach(r => materialRisks.push(Object.assign(Object.assign({}, r), { projectName: p.name })));
            // Issues
            const cIssues = p.issues.filter(i => i.priority === 'HIGH');
            cIssues.forEach(i => criticalIssues.push(Object.assign(Object.assign({}, i), { projectName: p.name })));
        });
        const portfolioProgress = totalActiveProjects > 0 ? Math.round(portfolioProgressSum / totalActiveProjects) : 0;
        const pendingDprs = yield prisma_1.default.dailyProgressReport.findMany({
            where: { project: orgWhere, status: 'SUBMITTED' },
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        const attentionRequired = [
            ...pendingDprs.map(dpr => ({
                id: `dpr-${dpr.id}`,
                title: `Pending DPR Approval - ${dpr.project.name}`,
                type: 'Approval',
                time: dpr.createdAt,
                link: `/projects/${dpr.projectId}/dpr`
            })),
            ...criticalIssues.map(issue => ({
                id: `issue-${issue.id}`,
                title: `Critical Issue: ${issue.title} (${issue.projectName})`,
                type: 'Review',
                time: issue.createdAt,
                link: `/projects/${issue.projectId}/issues`
            })),
            ...materialRisks.map(risk => ({
                id: `risk-${risk.id}`,
                title: `High Risk: ${risk.title} (${risk.projectName})`,
                type: 'Risk',
                time: risk.createdAt,
                link: `/projects/${risk.projectId}/risks`
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
        return res.json({
            totalActiveProjects,
            totalProjectValue,
            portfolioBudget,
            totalActualCost,
            portfolioProgress,
            procurementExposure,
            delayedProjectsCount,
            delayedProjects,
            materialRisks,
            criticalIssues,
            attentionRequired
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching executive dashboard', error });
    }
});
exports.getExecutiveDashboard = getExecutiveDashboard;
