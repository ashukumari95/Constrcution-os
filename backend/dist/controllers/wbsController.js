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
exports.createWbsElement = exports.getWbsElements = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const projectAccess_1 = require("../utils/projectAccess");
const getWbsElements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const elements = yield prisma_1.default.wbsElement.findMany({
            where: { projectId },
            include: { children: true }
        });
        return res.json(elements);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching WBS', error });
    }
});
exports.getWbsElements = getWbsElements;
const createWbsElement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const { name, parentId, startDate, endDate, responsibleName } = req.body;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const element = yield prisma_1.default.wbsElement.create({
            data: {
                projectId,
                name,
                parentId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                responsibleName
            }
        });
        return res.status(201).json(element);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating WBS element', error });
    }
});
exports.createWbsElement = createWbsElement;
