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
exports.addInventoryItem = exports.getInventory = exports.createMaterial = exports.getMaterials = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const materials = yield prisma_1.default.material.findMany({
            where: { organizationId: req.user.organizationId }
        });
        return res.json(materials);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching materials', error });
    }
});
exports.getMaterials = getMaterials;
const createMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, code, category, unit } = req.body;
        const material = yield prisma_1.default.material.create({
            data: {
                name,
                code,
                category,
                unit,
                organizationId: req.user.organizationId
            }
        });
        return res.status(201).json(material);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating material', error });
    }
});
exports.createMaterial = createMaterial;
const getInventory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        if (!projectId)
            return res.status(400).json({ message: 'projectId is required' });
        // Validate project ownership
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const inventory = yield prisma_1.default.projectInventory.findMany({
            where: { projectId: projectId },
            include: {
                material: true
            }
        });
        // Calculate derived available quantity on the fly for response
        const enrichedInventory = inventory.map(inv => (Object.assign(Object.assign({}, inv), { availableQuantity: inv.receivedQuantity - inv.consumedQuantity })));
        return res.json(enrichedInventory);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching inventory', error });
    }
});
exports.getInventory = getInventory;
const addInventoryItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, materialId, requiredQuantity, reorderLevel } = req.body;
        // Project isolation check
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const inventory = yield prisma_1.default.projectInventory.create({
            data: {
                projectId,
                materialId,
                requiredQuantity,
                reorderLevel,
                receivedQuantity: 0,
                consumedQuantity: 0
            }
        });
        return res.status(201).json(inventory);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error adding inventory item', error });
    }
});
exports.addInventoryItem = addInventoryItem;
