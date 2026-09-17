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
exports.createSite = exports.getSitesByProject = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const projectAccess_1 = require("../utils/projectAccess");
const getSitesByProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        // Verify project access
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const sites = yield prisma_1.default.site.findMany({
            where: { projectId },
            include: { siteManager: { select: { id: true, firstName: true, lastName: true } } }
        });
        return res.json(sites);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching sites', error });
    }
});
exports.getSitesByProject = getSitesByProject;
const createSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const { name, location, status, startDate, notes, siteManagerId } = req.body;
        // Verify project access
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const site = yield prisma_1.default.site.create({
            data: {
                projectId,
                name,
                location,
                status,
                startDate: startDate ? new Date(startDate) : null,
                notes,
                siteManagerId
            }
        });
        return res.status(201).json(site);
    }
    catch (error) {
        console.error("Site creation error:", error);
        return res.status(500).json({ message: 'Error creating site', error });
    }
});
exports.createSite = createSite;
