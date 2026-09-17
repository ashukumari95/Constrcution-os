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
exports.getProjectHealth = exports.updateProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        let whereClause = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        // Strict Client Data Isolation
        if (req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view')) {
            whereClause.members = {
                some: { userId: req.user.id }
            };
        }
        const projects = yield prisma_1.default.project.findMany({
            where: whereClause,
            include: {
                projectManager: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { sites: true, tasks: true } }
            }
        });
        return res.json(projects);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching projects', error });
    }
});
exports.getProjects = getProjects;
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        let whereClause = {
            id: req.params.id
        };
        if (!isSuperAdmin) {
            whereClause.organizationId = req.user.organizationId;
        }
        const isClient = req.user.role === 'CLIENT' || req.user.permissions.includes('client.dashboard.view');
        // Strict Client Data Isolation
        if (isClient) {
            whereClause.members = {
                some: { userId: req.user.id }
            };
        }
        const project = yield prisma_1.default.project.findFirst({
            where: whereClause,
            include: {
                projectManager: { select: { id: true, firstName: true, lastName: true } },
                sites: true,
                wbsElements: { include: { children: true } },
                members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
                boqItems: true
            }
        });
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        // Strip internal information if client
        if (isClient) {
            // For instance, strip BOQ pricing if they shouldn't see internal rates
            // Usually BOQ is contract value, but we can leave it or zero out internal rates if they existed.
            // We will ensure that things like issues or internal expenses are blocked at their respective endpoints.
        }
        return res.json(project);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching project', error });
    }
});
exports.getProjectById = getProjectById;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, projectCode, client, projectType, location, startDate, plannedCompletion, contractValue, budget, projectManagerId, status } = req.body;
        const project = yield prisma_1.default.project.create({
            data: {
                name,
                description,
                projectCode,
                client,
                projectType,
                location,
                startDate: startDate ? new Date(startDate) : null,
                plannedCompletion: plannedCompletion ? new Date(plannedCompletion) : null,
                contractValue,
                budget,
                projectManagerId,
                status: status || 'PLANNING',
                organizationId: req.user.organizationId
            }
        });
        // Automatically add creator as a member
        if (req.user.id) {
            yield prisma_1.default.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: req.user.id
                }
            });
        }
        return res.status(201).json(project);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating project', error });
    }
});
exports.createProject = createProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, projectCode, client, projectType, location, startDate, plannedCompletion, actualCompletion, contractValue, budget, projectManagerId, status } = req.body;
        // Verify ownership
        const existing = yield prisma_1.default.project.findFirst({ where: { id: req.params.id, organizationId: req.user.organizationId } });
        if (!existing)
            return res.status(404).json({ message: 'Project not found' });
        const project = yield prisma_1.default.project.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                projectCode,
                client,
                projectType,
                location,
                startDate: startDate ? new Date(startDate) : null,
                plannedCompletion: plannedCompletion ? new Date(plannedCompletion) : null,
                actualCompletion: actualCompletion ? new Date(actualCompletion) : null,
                contractValue,
                budget,
                projectManagerId,
                status
            }
        });
        return res.json(project);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating project', error });
    }
});
exports.updateProject = updateProject;
const getProjectHealth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // Check permission
        const project = yield prisma_1.default.project.findFirst({
            where: { id, organizationId: req.user.organizationId }
        });
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        // 1. Fetch metrics
        const tasks = yield prisma_1.default.task.findMany({ where: { projectId: id } });
        const issues = yield prisma_1.default.issue.findMany({ where: { projectId: id } });
        const budgetRevisions = yield prisma_1.default.budgetRevision.findMany({ where: { budget: { projectId: id } } });
        const expenses = yield prisma_1.default.expense.findMany({ where: { projectId: id } });
        const invoices = yield prisma_1.default.invoice.findMany({ where: { projectId: id, status: { not: 'REJECTED' } } });
        const risks = yield prisma_1.default.projectRisk.findMany({ where: { projectId: id } });
        // 2. Health Calculations
        // A. Schedule Health (based on Tasks)
        let scheduleScore = null;
        let scheduleData = false;
        let scheduleReason = '';
        if (tasks.length > 0) {
            scheduleData = true;
            const completed = tasks.filter(t => t.status === 'COMPLETED').length;
            const overdue = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()).length;
            const onTimeCompletionRatio = completed / tasks.length;
            const overdueRatio = overdue / tasks.length;
            scheduleScore = Math.max(0, 100 - (overdueRatio * 100)); // Penalize for overdue
            if (overdueRatio > 0.2)
                scheduleReason = `${overdue} tasks are overdue.`;
            else
                scheduleReason = 'Schedule is mostly on track.';
        }
        // B. Cost Health
        let costScore = null;
        let costData = false;
        let costReason = '';
        const approvedBudget = project.budget || 0; // Or from revisions
        let invoicedTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
        let expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const actualCost = invoicedTotal + expensesTotal; // Simplified, assuming invoices and expenses don't overlap for health score
        if (approvedBudget > 0) {
            costData = true;
            const variance = approvedBudget - actualCost;
            if (variance < 0) {
                costScore = Math.max(0, 100 - (Math.abs(variance) / approvedBudget * 100));
                costReason = `Project is over budget by ${Math.abs(variance)}.`;
            }
            else {
                costScore = 100;
                costReason = 'Project is within budget.';
            }
        }
        // C. Progress Health
        let progressScore = null;
        let progressData = false;
        let progressReason = '';
        if (tasks.length > 0) {
            progressData = true;
            const completed = tasks.filter(t => t.status === 'COMPLETED').length;
            progressScore = Math.round((completed / tasks.length) * 100);
            progressReason = `${completed} out of ${tasks.length} tasks completed.`;
        }
        // D. Issues Health
        let issueScore = null;
        let issueData = false;
        let issueReason = '';
        if (issues.length > 0) {
            issueData = true;
            const openIssues = issues.filter(i => i.status === 'OPEN').length;
            const criticalOpen = issues.filter(i => i.status === 'OPEN' && i.priority === 'HIGH').length;
            issueScore = Math.max(0, 100 - (criticalOpen * 15) - (openIssues * 2));
            issueReason = `${openIssues} open issues, ${criticalOpen} critical.`;
        }
        // E. Risk Health
        let riskScore = null;
        let riskData = false;
        let riskReason = '';
        if (risks.length > 0) {
            riskData = true;
            const openRisks = risks.filter(r => r.status === 'OPEN');
            const totalRiskScore = openRisks.reduce((sum, r) => sum + r.riskScore, 0);
            // Assume max risk score per risk is 25 (5x5). Normalize based on volume.
            const avgRisk = openRisks.length > 0 ? totalRiskScore / openRisks.length : 0;
            riskScore = Math.max(0, 100 - (avgRisk * 4)); // 25 * 4 = 100
            riskReason = `${openRisks.length} open risks with avg severity ${avgRisk.toFixed(1)}.`;
        }
        // 3. Dynamic Normalization
        const components = [
            { name: 'Schedule', score: scheduleScore, available: scheduleData, reason: scheduleReason, weight: 0.25 },
            { name: 'Cost', score: costScore, available: costData, reason: costReason, weight: 0.25 },
            { name: 'Progress', score: progressScore, available: progressData, reason: progressReason, weight: 0.15 },
            { name: 'Issues', score: issueScore, available: issueData, reason: issueReason, weight: 0.20 },
            { name: 'Risks', score: riskScore, available: riskData, reason: riskReason, weight: 0.15 }
        ];
        let totalAvailableWeight = 0;
        let accumulatedScore = 0;
        const breakdown = components.map(c => {
            if (c.available) {
                totalAvailableWeight += c.weight;
                accumulatedScore += c.score * c.weight;
            }
            return {
                metric: c.name,
                available: c.available,
                score: c.available ? Math.round(c.score) : null,
                reason: c.available ? c.reason : 'Insufficient Data'
            };
        });
        const overallScore = totalAvailableWeight > 0 ? Math.round(accumulatedScore / totalAvailableWeight) : null;
        return res.json({
            overallScore,
            breakdown
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error calculating project health', error });
    }
});
exports.getProjectHealth = getProjectHealth;
