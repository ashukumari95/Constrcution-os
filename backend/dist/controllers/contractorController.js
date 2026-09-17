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
exports.updateContractor = exports.createContractor = exports.getContractorById = exports.getContractors = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getContractors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contractors = yield prisma_1.default.contractor.findMany({
            where: { organizationId: req.user.organizationId },
            include: {
                projects: { select: { id: true, name: true } },
                workers: { select: { id: true } }
            }
        });
        return res.json(contractors);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching contractors', error });
    }
});
exports.getContractors = getContractors;
const getContractorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contractor = yield prisma_1.default.contractor.findFirst({
            where: {
                id: req.params.id,
                organizationId: req.user.organizationId
            },
            include: {
                projects: { select: { id: true, name: true, status: true } },
                workers: true
            }
        });
        if (!contractor)
            return res.status(404).json({ message: 'Contractor not found' });
        return res.json(contractor);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching contractor', error });
    }
});
exports.getContractorById = getContractorById;
const createContractor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyName, contactPerson, email, phone, contractValue, projectIds } = req.body;
        if (projectIds && projectIds.length > 0) {
            const { getAccessibleProject } = require('../utils/projectAccess');
            for (const pid of projectIds) {
                const project = yield getAccessibleProject(pid, req.user);
                if (!project)
                    return res.status(404).json({ message: `Project ${pid} not found or access denied` });
            }
        }
        const contractor = yield prisma_1.default.contractor.create({
            data: {
                companyName,
                contactPerson,
                email,
                phone,
                contractValue,
                organizationId: req.user.organizationId,
                projects: projectIds ? { connect: projectIds.map((id) => ({ id })) } : undefined
            }
        });
        return res.status(201).json(contractor);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating contractor', error });
    }
});
exports.createContractor = createContractor;
const updateContractor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        const id = req.params.id;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Contractor ID is required' });
        }
        const { companyName, contactPerson, email, phone, contractValue, projectIds } = req.body;
        // Verify ownership
        const existing = yield prisma_1.default.contractor.findFirst({ where: { id, organizationId } });
        if (!existing)
            return res.status(404).json({ message: 'Contractor not found' });
        const contractor = yield prisma_1.default.contractor.update({
            where: { id },
            data: {
                companyName,
                contactPerson,
                email,
                phone,
                contractValue,
                projects: projectIds ? { set: projectIds.map((id) => ({ id })) } : undefined
            }
        });
        return res.json(contractor);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating contractor', error });
    }
});
exports.updateContractor = updateContractor;
