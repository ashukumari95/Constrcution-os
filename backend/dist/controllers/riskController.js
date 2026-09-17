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
exports.deleteRisk = exports.updateRisk = exports.createRisk = exports.getAllRisks = exports.getProjectRisks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Get risks for a specific project
const getProjectRisks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const risks = yield prisma_1.default.projectRisk.findMany({
            where: { projectId },
            include: {
                owner: { select: { firstName: true, lastName: true } },
                reportedBy: { select: { firstName: true, lastName: true } }
            },
            orderBy: { riskScore: 'desc' }
        });
        return res.json(risks);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching project risks', error });
    }
});
exports.getProjectRisks = getProjectRisks;
// Get all risks across portfolio (for Executive Dashboard)
const getAllRisks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = req.user.organizationId;
        const risks = yield prisma_1.default.projectRisk.findMany({
            where: { project: { organizationId: orgId } },
            include: {
                project: { select: { name: true } },
                owner: { select: { firstName: true, lastName: true } }
            },
            orderBy: { riskScore: 'desc' }
        });
        return res.json(risks);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global risks', error });
    }
});
exports.getAllRisks = getAllRisks;
const createRisk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const { title, description, category, severity, probability, impact, dueDate, targetResolutionDate, mitigationPlan, contingencyPlan, ownerId } = req.body;
        const riskScore = probability * impact;
        const riskCode = `RSK-${Math.floor(1000 + Math.random() * 9000)}`; // Simple code generator
        const risk = yield prisma_1.default.projectRisk.create({
            data: {
                projectId,
                riskCode,
                title,
                description,
                category,
                severity,
                probability,
                impact,
                riskScore,
                dueDate: dueDate ? new Date(dueDate) : null,
                targetResolutionDate: targetResolutionDate ? new Date(targetResolutionDate) : null,
                mitigationPlan,
                contingencyPlan,
                ownerId,
                reportedById: req.user.id
            }
        });
        return res.status(201).json(risk);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating risk', error });
    }
});
exports.createRisk = createRisk;
const updateRisk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = req.params.id;
        const data = req.body;
        const projectId = req.query.projectId;
        // Recalculate score if prob or impact changes
        if (data.probability !== undefined || data.impact !== undefined) {
            const existing = yield prisma_1.default.projectRisk.findUnique({ where: { id } });
            if (existing) {
                const p = (_a = data.probability) !== null && _a !== void 0 ? _a : existing.probability;
                const i = (_b = data.impact) !== null && _b !== void 0 ? _b : existing.impact;
                data.riskScore = p * i;
            }
        }
        if (data.dueDate)
            data.dueDate = new Date(data.dueDate);
        if (data.targetResolutionDate)
            data.targetResolutionDate = new Date(data.targetResolutionDate);
        data.updatedById = req.user.id;
        const risk = yield prisma_1.default.projectRisk.update({
            where: { id },
            data
        });
        return res.json(risk);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating risk', error });
    }
});
exports.updateRisk = updateRisk;
const deleteRisk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.default.projectRisk.delete({ where: { id } });
        return res.json({ message: 'Risk deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error deleting risk', error });
    }
});
exports.deleteRisk = deleteRisk;
