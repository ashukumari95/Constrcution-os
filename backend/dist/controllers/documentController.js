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
exports.approveDocument = exports.uploadNewVersion = exports.getDocumentHistory = exports.getDocuments = exports.uploadDocument = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const storageService_1 = require("../services/storageService");
const auditService_1 = require("../services/auditService");
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, title, documentType, comments } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project) {
            return res.status(403).json({ message: 'Unauthorized project access' });
        }
        // Save physical file
        const { fileUrl, fileName, fileSize, mimeType } = yield storageService_1.storageService.uploadFile(file, 'documents');
        // Create DB records
        const document = yield prisma_1.default.projectDocument.create({
            data: {
                title: title,
                category: documentType || 'Other',
                projectId: projectId,
                versions: {
                    create: {
                        versionNumber: 1,
                        fileUrl,
                        fileName,
                        fileSize,
                        mimeType,
                        uploadedById: req.user.id,
                        changeDesc: comments || null
                    }
                }
            },
            include: {
                versions: true
            }
        });
        yield auditService_1.AuditService.log({
            action: 'DOCUMENT_UPLOADED',
            entity: 'ProjectDocument',
            entityId: document.id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.status(201).json(document);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error uploading document', error: error.message });
    }
});
exports.uploadDocument = uploadDocument;
const getDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const documents = yield prisma_1.default.projectDocument.findMany({
            where,
            include: {
                project: { select: { name: true, organizationId: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        uploadedBy: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const filtered = documents.filter(d => d.project.organizationId === req.user.organizationId);
        return res.json(filtered);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching documents', error });
    }
});
exports.getDocuments = getDocuments;
const getDocumentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const document = yield prisma_1.default.projectDocument.findUnique({
            where: { id: id },
            include: {
                project: true,
                versions: {
                    include: {
                        uploadedBy: { select: { firstName: true, lastName: true } }
                    },
                    orderBy: { versionNumber: 'desc' }
                }
            }
        });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(document.projectId, req.user);
        if (!project)
            return res.status(403).json({ message: 'Unauthorized project access' });
        return res.json(document.versions);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching document history', error });
    }
});
exports.getDocumentHistory = getDocumentHistory;
const uploadNewVersion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const document = yield prisma_1.default.projectDocument.findUnique({
            where: { id: id },
            include: {
                project: true,
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const { getAccessibleProject } = require('../utils/projectAccess');
        const projectAccess = yield getAccessibleProject(document.projectId, req.user);
        if (!projectAccess)
            return res.status(403).json({ message: 'Unauthorized project access' });
        const { fileUrl, fileName, fileSize, mimeType } = yield storageService_1.storageService.uploadFile(file, 'documents');
        const nextVersionNumber = (((_a = document.versions[0]) === null || _a === void 0 ? void 0 : _a.versionNumber) || 0) + 1;
        const newVersion = yield prisma_1.default.documentVersion.create({
            data: {
                documentId: id,
                versionNumber: nextVersionNumber,
                fileUrl,
                fileName,
                fileSize,
                mimeType,
                uploadedById: req.user.id,
                changeDesc: comments || null
            }
        });
        // Reset status to DRAFT or UNDER_REVIEW on new version
        yield prisma_1.default.projectDocument.update({
            where: { id: id },
            data: { status: 'UNDER_REVIEW' }
        });
        yield auditService_1.AuditService.log({
            action: 'DOCUMENT_VERSION_ADDED',
            entity: 'ProjectDocument',
            entityId: document.id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.status(201).json(newVersion);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error uploading new version', error: error.message });
    }
});
exports.uploadNewVersion = uploadNewVersion;
const approveDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const document = yield prisma_1.default.projectDocument.findUnique({
            where: { id: id },
            include: { project: true }
        });
        if (!document || document.project.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'Document not found' });
        }
        // Role check
        const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized to approve documents' });
        }
        const updated = yield prisma_1.default.projectDocument.update({
            where: { id: id },
            data: {
                status: status
            }
        });
        yield auditService_1.AuditService.log({
            action: `DOCUMENT_${status}`,
            entity: 'ProjectDocument',
            entityId: id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error approving document', error });
    }
});
exports.approveDocument = approveDocument;
