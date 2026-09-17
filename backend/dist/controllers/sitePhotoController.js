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
exports.getSitePhotos = exports.uploadSitePhoto = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const storageService_1 = require("../services/storageService");
const auditService_1 = require("../services/auditService");
const uploadSitePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, siteId, description, location, taskId, issueId, dprId } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project) {
            return res.status(403).json({ message: 'Unauthorized project access' });
        }
        // Save physical file
        const { fileUrl } = yield storageService_1.storageService.uploadFile(file, 'photos');
        const photo = yield prisma_1.default.sitePhoto.create({
            data: {
                url: fileUrl,
                description,
                location,
                projectId: projectId,
                siteId: siteId ? siteId : null,
                taskId: taskId ? taskId : null,
                issueId: issueId ? issueId : null,
                dprId: dprId ? dprId : null,
                uploaderId: req.user.id
            }
        });
        yield auditService_1.AuditService.log({
            action: 'PHOTO_UPLOADED',
            entity: 'SitePhoto',
            entityId: photo.id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.status(201).json(photo);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error uploading photo', error: error.message });
    }
});
exports.uploadSitePhoto = uploadSitePhoto;
const getSitePhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, siteId, taskId, issueId, dprId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (siteId)
            where.siteId = siteId;
        if (taskId)
            where.taskId = taskId;
        if (issueId)
            where.issueId = issueId;
        if (dprId)
            where.dprId = dprId;
        const photos = yield prisma_1.default.sitePhoto.findMany({
            where,
            include: {
                uploader: { select: { firstName: true, lastName: true } },
                project: { select: { name: true, organizationId: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const filtered = photos.filter(p => p.project.organizationId === req.user.organizationId);
        return res.json(filtered);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching photos', error });
    }
});
exports.getSitePhotos = getSitePhotos;
