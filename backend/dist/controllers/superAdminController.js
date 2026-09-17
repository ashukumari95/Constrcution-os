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
exports.updatePlan = exports.extendTrial = exports.listOrganizations = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditLogger_1 = require("../utils/auditLogger");
const listOrganizations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizations = yield prisma_1.default.organization.findMany({
            include: {
                _count: {
                    select: { users: true, projects: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Compute dynamic TRIAL_EXPIRED status
        const mapped = organizations.map(org => {
            let computedSubscriptionStatus = org.subscriptionStatus || 'ACTIVE';
            if (computedSubscriptionStatus === 'TRIAL' &&
                org.trialEndsAt &&
                new Date() > org.trialEndsAt) {
                computedSubscriptionStatus = 'TRIAL_EXPIRED';
            }
            return {
                id: org.id,
                name: org.name,
                subdomain: org.subdomain,
                createdAt: org.createdAt,
                status: org.status,
                plan: org.plan,
                subscriptionStatus: computedSubscriptionStatus,
                trialStartedAt: org.trialStartedAt,
                trialEndsAt: org.trialEndsAt,
                userCount: org._count.users,
                projectCount: org._count.projects,
            };
        });
        res.json(mapped);
    }
    catch (error) {
        console.error('List organizations error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.listOrganizations = listOrganizations;
const extendTrial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { additionalDays } = req.body;
        if (!additionalDays || additionalDays <= 0) {
            return res.status(400).json({ message: 'Valid additionalDays is required' });
        }
        const org = yield prisma_1.default.organization.findUnique({ where: { id } });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        // Use current trialEndsAt or now if null
        const baseDate = org.trialEndsAt ? new Date(org.trialEndsAt) : new Date();
        const newTrialEndsAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
        const updatedOrg = yield prisma_1.default.organization.update({
            where: { id },
            data: {
                trialEndsAt: newTrialEndsAt,
                subscriptionStatus: 'TRIAL'
            }
        });
        yield (0, auditLogger_1.logAudit)('EXTEND_TRIAL', 'Organization', id, req.user.id, req.user.organizationId, // SUPER_ADMIN's organization
        { previousEndsAt: org.trialEndsAt, newEndsAt: newTrialEndsAt, addedDays: additionalDays });
        let computedSubscriptionStatus = updatedOrg.subscriptionStatus;
        if (computedSubscriptionStatus === 'TRIAL' && updatedOrg.trialEndsAt && new Date() > updatedOrg.trialEndsAt) {
            computedSubscriptionStatus = 'TRIAL_EXPIRED';
        }
        res.json({
            message: 'Trial extended successfully',
            organization: {
                id: updatedOrg.id,
                name: updatedOrg.name,
                trialEndsAt: updatedOrg.trialEndsAt,
                subscriptionStatus: computedSubscriptionStatus
            }
        });
    }
    catch (error) {
        console.error('Extend trial error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.extendTrial = extendTrial;
const updatePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { plan, subscriptionStatus, userLimit, projectLimit, storageLimit } = req.body;
        const org = yield prisma_1.default.organization.update({
            where: { id },
            data: {
                plan,
                subscriptionStatus,
                userLimit,
                projectLimit,
                storageLimit
            }
        });
        yield (0, auditLogger_1.logAudit)('UPDATE_PLAN', 'Organization', id, req.user.id, req.user.organizationId, { plan, subscriptionStatus, userLimit, projectLimit, storageLimit });
        res.json({ message: 'Plan updated successfully', organization: org });
    }
    catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updatePlan = updatePlan;
