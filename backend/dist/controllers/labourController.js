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
exports.markAttendance = exports.getAttendance = exports.createWorker = exports.getWorkers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getWorkers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, contractorId } = req.query;
        const where = { organizationId: req.user.organizationId };
        if (projectId)
            where.projectId = projectId;
        if (contractorId)
            where.contractorId = contractorId;
        const workers = yield prisma_1.default.worker.findMany({
            where,
            include: {
                contractor: { select: { companyName: true } },
                project: { select: { name: true } }
            }
        });
        return res.json(workers);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching workers', error });
    }
});
exports.getWorkers = getWorkers;
const createWorker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, category, type, dailyRate, projectId, contractorId } = req.body;
        if (projectId) {
            const { getAccessibleProject } = require('../utils/projectAccess');
            const project = yield getAccessibleProject(projectId, req.user);
            if (!project)
                return res.status(404).json({ message: 'Project not found or access denied' });
        }
        const worker = yield prisma_1.default.worker.create({
            data: {
                firstName,
                lastName,
                category,
                type,
                dailyRate,
                projectId,
                contractorId,
                organizationId: req.user.organizationId
            }
        });
        return res.status(201).json(worker);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating worker', error });
    }
});
exports.createWorker = createWorker;
const getAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, siteId, date } = req.query;
        // Project isolation check: user must be member of project if projectId is provided
        // (Assuming simple organization isolation for this controller for now)
        const where = {
            worker: { organizationId: req.user.organizationId }
        };
        if (projectId)
            where.projectId = projectId;
        if (siteId)
            where.siteId = siteId;
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const nextD = new Date(d);
            nextD.setDate(d.getDate() + 1);
            where.date = { gte: d, lt: nextD };
        }
        const attendance = yield prisma_1.default.labourAttendance.findMany({
            where,
            include: {
                worker: { select: { firstName: true, lastName: true, category: true, type: true } }
            }
        });
        return res.json(attendance);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance', error });
    }
});
exports.getAttendance = getAttendance;
const markAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, records, projectId, siteId } = req.body;
        // records: { workerId, status }[]
        if (projectId) {
            const { getAccessibleProject } = require('../utils/projectAccess');
            const project = yield getAccessibleProject(projectId, req.user);
            if (!project)
                return res.status(404).json({ message: 'Project not found or access denied' });
        }
        const dateObj = new Date(date);
        const results = [];
        for (const rec of records) {
            // Upsert based on workerId, date
            const attendance = yield prisma_1.default.labourAttendance.create({
                data: {
                    date: dateObj,
                    status: rec.status,
                    workerId: rec.workerId,
                    projectId,
                    siteId
                }
            });
            results.push(attendance);
        }
        return res.status(201).json({ message: 'Attendance marked', count: results.length });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error marking attendance', error });
    }
});
exports.markAttendance = markAttendance;
