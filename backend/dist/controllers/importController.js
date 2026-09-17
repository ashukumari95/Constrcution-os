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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportJobs = exports.uploadImportFile = void 0;
const client_1 = require("@prisma/client");
const LocalStorageProvider_1 = require("../providers/LocalStorageProvider");
const prisma = new client_1.PrismaClient();
const storage = new LocalStorageProvider_1.LocalStorageProvider();
const uploadImportFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { module, batchId } = req.body;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!organizationId || !userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!module) {
            res.status(400).json({ error: 'Module is required' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Basic Validation
        const fileExtension = (_c = req.file.originalname.split('.').pop()) === null || _c === void 0 ? void 0 : _c.toLowerCase();
        if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
            res.status(400).json({ error: 'Only CSV or XLSX files are allowed' });
            return;
        }
        // Upload file
        const storageDir = `imports/${organizationId}/${module}`;
        const sourcePath = yield storage.upload(req.file, storageDir);
        // Create ImportJob record
        const importJob = yield prisma.importJob.create({
            data: {
                module,
                filename: req.file.originalname,
                fileSize: req.file.size,
                fileType: req.file.mimetype,
                sourcePath,
                batchId: batchId || null,
                status: 'UPLOADED',
                organizationId,
                userId,
            }
        });
        res.status(201).json({ message: 'File uploaded successfully', importJob });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.uploadImportFile = uploadImportFile;
const getImportJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const jobs = yield prisma.importJob.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error fetching import jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getImportJobs = getImportJobs;
