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
exports.getGlobalUsers = exports.getGlobalDocuments = exports.getGlobalFinance = exports.getGlobalDpr = exports.getGlobalLabour = exports.getGlobalIssues = exports.getGlobalProcurement = exports.getGlobalBoq = exports.getGlobalTasks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getGlobalTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const tasks = yield prisma_1.default.task.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
        return res.json(tasks);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global tasks', error });
    }
});
exports.getGlobalTasks = getGlobalTasks;
const getGlobalBoq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const items = yield prisma_1.default.boqItem.findMany({
            where: { project: orgWhere },
            include: { project: { select: { id: true, name: true } } }
        });
        return res.json(items);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global BOQ', error });
    }
});
exports.getGlobalBoq = getGlobalBoq;
const getGlobalProcurement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const requests = yield prisma_1.default.purchaseRequest.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } },
                requestedBy: { select: { id: true, firstName: true, lastName: true } }
            }
        });
        return res.json(requests);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global procurement', error });
    }
});
exports.getGlobalProcurement = getGlobalProcurement;
const getGlobalIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const issues = yield prisma_1.default.issue.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } },
                reportedBy: { select: { id: true, firstName: true, lastName: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } }
            }
        });
        return res.json(issues);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global issues', error });
    }
});
exports.getGlobalIssues = getGlobalIssues;
const getGlobalLabour = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const labour = yield prisma_1.default.worker.findMany({
            where: orgWhere,
            include: {
                project: { select: { id: true, name: true } },
                contractor: { select: { id: true, companyName: true } }
            }
        });
        return res.json(labour);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global labour', error });
    }
});
exports.getGlobalLabour = getGlobalLabour;
const getGlobalDpr = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const dprs = yield prisma_1.default.dailyProgressReport.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } },
                preparedBy: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { date: 'desc' }
        });
        return res.json(dprs);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global dprs', error });
    }
});
exports.getGlobalDpr = getGlobalDpr;
const getGlobalFinance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const invoices = yield prisma_1.default.invoice.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } },
                vendor: { select: { id: true, name: true } }
            },
            orderBy: { date: 'desc' }
        });
        return res.json(invoices);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global finance', error });
    }
});
exports.getGlobalFinance = getGlobalFinance;
const getGlobalDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const documents = yield prisma_1.default.projectDocument.findMany({
            where: { project: orgWhere },
            include: {
                project: { select: { id: true, name: true } }
            }
        });
        return res.json(documents);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global documents', error });
    }
});
exports.getGlobalDocuments = getGlobalDocuments;
const getGlobalUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgWhere = isSuperAdmin ? {} : { organizationId: req.user.organizationId };
        const users = yield prisma_1.default.user.findMany({
            where: orgWhere,
            include: {
                role: { select: { id: true, name: true } }
            }
        });
        return res.json(users);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching global users', error });
    }
});
exports.getGlobalUsers = getGlobalUsers;
