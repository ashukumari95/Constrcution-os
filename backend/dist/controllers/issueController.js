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
exports.addIssueComment = exports.updateIssue = exports.createIssue = exports.getIssues = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditService_1 = require("../services/auditService");
const getIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const issues = yield prisma_1.default.issue.findMany({
            where,
            include: {
                reportedBy: { select: { firstName: true, lastName: true } },
                assignedTo: { select: { firstName: true, lastName: true } },
                project: { select: { name: true, organizationId: true } },
                comments: {
                    include: {
                        author: { select: { firstName: true, lastName: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                photos: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const filtered = issues.filter(i => i.project.organizationId === req.user.organizationId);
        return res.json(filtered);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching issues', error });
    }
});
exports.getIssues = getIssues;
const createIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, type, priority, projectId, siteId, assignedToId, location, dueDate } = req.body;
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project) {
            return res.status(403).json({ message: 'Unauthorized project access' });
        }
        const issue = yield prisma_1.default.issue.create({
            data: {
                title,
                description,
                type: type || 'GENERAL',
                priority: priority || 'MEDIUM',
                status: 'OPEN',
                location,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: projectId,
                siteId: siteId || null,
                reportedById: req.user.id,
                assignedToId: assignedToId || null
            }
        });
        yield auditService_1.AuditService.log({
            action: 'ISSUE_CREATED',
            entity: 'Issue',
            entityId: issue.id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.status(201).json(issue);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating issue', error });
    }
});
exports.createIssue = createIssue;
const updateIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, priority, type, status, assignedToId, resolution, location, dueDate } = req.body;
        const existingIssue = yield prisma_1.default.issue.findUnique({
            where: { id: id },
            include: { project: true }
        });
        if (!existingIssue || existingIssue.project.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'Issue not found or unauthorized' });
        }
        const updateData = {
            title,
            description,
            priority,
            type,
            status,
            assignedToId,
            location,
            dueDate: dueDate ? new Date(dueDate) : existingIssue.dueDate
        };
        if (resolution !== undefined) {
            updateData.resolution = resolution;
        }
        const issue = yield prisma_1.default.issue.update({
            where: { id: id },
            data: updateData
        });
        if (status && status !== existingIssue.status) {
            yield auditService_1.AuditService.log({
                action: `ISSUE_STATUS_CHANGED_${status}`,
                entity: 'Issue',
                entityId: issue.id,
                userId: req.user.id,
                organizationId: req.user.organizationId,
            });
        }
        return res.json(issue);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating issue', error });
    }
});
exports.updateIssue = updateIssue;
const addIssueComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text } = req.body; // was 'content', model uses 'text'
        const existingIssue = yield prisma_1.default.issue.findUnique({
            where: { id: id },
            include: { project: true }
        });
        if (!existingIssue || existingIssue.project.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        const comment = yield prisma_1.default.issueComment.create({
            data: {
                text,
                issueId: id,
                authorId: req.user.id
            },
            include: {
                author: { select: { firstName: true, lastName: true } }
            }
        });
        yield auditService_1.AuditService.log({
            action: 'ISSUE_COMMENT_ADDED',
            entity: 'Issue',
            entityId: id,
            userId: req.user.id,
            organizationId: req.user.organizationId,
        });
        return res.status(201).json(comment);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error adding comment', error });
    }
});
exports.addIssueComment = addIssueComment;
