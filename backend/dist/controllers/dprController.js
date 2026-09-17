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
exports.updateDPR = exports.createDPR = exports.getDPRs = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditService_1 = require("../services/auditService");
const getDPRs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const dprs = yield prisma_1.default.dailyProgressReport.findMany({
            where,
            include: {
                preparedBy: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
                project: { select: { name: true, organizationId: true } }
            },
            orderBy: { date: 'desc' }
        });
        const filtered = dprs.filter(d => d.project.organizationId === req.user.organizationId);
        return res.json(filtered);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching DPRs', error });
    }
});
exports.getDPRs = getDPRs;
const createDPR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, manpowerCount, workCompleted, issues, nextDayPlan, projectId, siteId, weather, equipment, quantities, materialReceived, materialConsumed, safetyObservations, status } = req.body;
        // Validate project access
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project) {
            return res.status(403).json({ message: 'Unauthorized project access' });
        }
        const dpr = yield prisma_1.default.dailyProgressReport.create({
            data: {
                date: new Date(date),
                manpowerCount,
                workCompleted,
                issues,
                nextDayPlan,
                status: status || 'DRAFT', // Site Engineer creates draft
                weather,
                equipment: equipment ? equipment : null,
                quantities: quantities ? quantities : null,
                materialReceived: materialReceived ? materialReceived : null,
                materialConsumed: materialConsumed ? materialConsumed : null,
                safetyObservations,
                projectId: projectId,
                siteId: siteId ? siteId : null,
                preparedById: req.user.id
            }
        });
        if (dpr.status === 'SUBMITTED') {
            yield auditService_1.AuditService.log({
                action: 'DPR_SUBMITTED',
                entity: 'DailyProgressReport',
                entityId: dpr.id,
                userId: req.user.id,
                organizationId: req.user.organizationId,
            });
        }
        return res.status(201).json(dpr);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating DPR', error });
    }
});
exports.createDPR = createDPR;
const updateDPR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { manpowerCount, workCompleted, issues, nextDayPlan, weather, equipment, quantities, materialReceived, materialConsumed, safetyObservations, status, rejectionReason } = req.body;
        const existingDpr = yield prisma_1.default.dailyProgressReport.findUnique({
            where: { id: id },
            include: { project: true }
        });
        if (!existingDpr || existingDpr.project.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'DPR not found or unauthorized' });
        }
        // Role check for approvals
        const isApprovalAction = status === 'APPROVED' || status === 'REJECTED';
        if (isApprovalAction) {
            const userRole = req.user.role;
            const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'];
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ message: 'You do not have permission to approve/reject DPRs' });
            }
        }
        const updateData = {
            manpowerCount,
            workCompleted,
            issues,
            nextDayPlan,
            status,
            weather,
            equipment: equipment !== undefined ? equipment : existingDpr.equipment,
            quantities: quantities !== undefined ? quantities : existingDpr.quantities,
            materialReceived: materialReceived !== undefined ? materialReceived : existingDpr.materialReceived,
            materialConsumed: materialConsumed !== undefined ? materialConsumed : existingDpr.materialConsumed,
            safetyObservations
        };
        if (isApprovalAction && existingDpr.status !== status) {
            updateData.approvedById = req.user.id;
            updateData.approvedAt = new Date();
            if (status === 'REJECTED') {
                updateData.rejectionReason = rejectionReason;
            }
        }
        const dpr = yield prisma_1.default.dailyProgressReport.update({
            where: { id: id },
            data: updateData
        });
        // Audit logs for status changes
        if (status && status !== existingDpr.status) {
            yield auditService_1.AuditService.log({
                action: `DPR_${status}`, // e.g. DPR_APPROVED
                entity: 'DailyProgressReport',
                entityId: dpr.id,
                userId: req.user.id,
                organizationId: req.user.organizationId,
            });
        }
        return res.json(dpr);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating DPR', error });
    }
});
exports.updateDPR = updateDPR;
