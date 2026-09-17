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
exports.uploadAttachment = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const storageService_1 = require("../services/storageService");
const projectAccess_1 = require("../utils/projectAccess");
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const tasks = yield prisma_1.default.task.findMany({
            where: { projectId },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
                dependencies: true,
                dependentOn: true,
                checklist: true,
                attachments: true
            }
        });
        return res.json(tasks);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching tasks', error });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const { title, description, priority, dueDate, wbsElementId, assigneeId } = req.body;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const task = yield prisma_1.default.task.create({
            data: {
                projectId,
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                wbsElementId,
                assigneeId
            },
            include: { assignee: { select: { id: true, firstName: true, lastName: true } } }
        });
        return res.status(201).json(task);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating task', error });
    }
});
exports.createTask = createTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const task = yield prisma_1.default.task.update({
            where: { id },
            data: { status }
        });
        return res.json(task);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating task', error });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const uploadAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'No file uploaded' });
        const task = yield prisma_1.default.task.findUnique({ where: { id: taskId } });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        const { fileUrl } = yield storageService_1.storageService.uploadFile(file, `tasks`);
        const attachment = yield prisma_1.default.taskAttachment.create({
            data: {
                taskId,
                fileName: file.originalname,
                fileUrl: fileUrl,
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedById: req.user.id
            }
        });
        return res.status(201).json(Object.assign(Object.assign({}, attachment), { fullUrl: storageService_1.storageService.getFileUrl(fileUrl) }));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error uploading attachment', error });
    }
});
exports.uploadAttachment = uploadAttachment;
