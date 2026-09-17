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
exports.consumeMaterial = exports.createMaterialReceipt = exports.createPurchaseOrder = exports.getPurchaseOrders = exports.createPurchaseRequest = exports.getPurchaseRequests = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getPurchaseRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const prs = yield prisma_1.default.purchaseRequest.findMany({
            where,
            include: {
                requestedBy: { select: { firstName: true, lastName: true } },
                project: { select: { name: true, organizationId: true } },
                items: { include: { material: true } }
            }
        });
        // Filter by organization
        const filteredPrs = prs.filter(pr => pr.project.organizationId === req.user.organizationId);
        return res.json(filteredPrs);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching purchase requests', error });
    }
});
exports.getPurchaseRequests = getPurchaseRequests;
const createPurchaseRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prNumber, projectId, siteId, items } = req.body;
        // items: { materialId, quantity }[]
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found or access denied' });
        const pr = yield prisma_1.default.purchaseRequest.create({
            data: {
                prNumber,
                projectId,
                siteId,
                requestedById: req.user.id,
                status: 'PENDING',
                items: {
                    create: items.map((item) => ({
                        materialId: item.materialId,
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true }
        });
        return res.status(201).json(pr);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating purchase request', error });
    }
});
exports.createPurchaseRequest = createPurchaseRequest;
const getPurchaseOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const pos = yield prisma_1.default.purchaseOrder.findMany({
            where,
            include: {
                vendor: true,
                project: { select: { name: true, organizationId: true } },
                items: { include: { material: true } }
            }
        });
        const filteredPos = pos.filter(po => po.project.organizationId === req.user.organizationId);
        return res.json(filteredPos);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching purchase orders', error });
    }
});
exports.getPurchaseOrders = getPurchaseOrders;
const createPurchaseOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { poNumber, vendorId, projectId, items } = req.body;
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found or access denied' });
        const po = yield prisma_1.default.purchaseOrder.create({
            data: {
                poNumber,
                vendorId,
                projectId,
                status: 'ISSUED',
                items: {
                    create: items.map((item) => ({
                        materialId: item.materialId,
                        quantity: item.quantity,
                        rate: item.rate,
                        total: item.quantity * item.rate
                    }))
                }
            },
            include: { items: true }
        });
        return res.status(201).json(po);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating purchase order', error });
    }
});
exports.createPurchaseOrder = createPurchaseOrder;
const createMaterialReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { receiptNumber, poId, projectId, items } = req.body;
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found or access denied' });
        const receipt = yield prisma_1.default.materialReceipt.create({
            data: {
                receiptNumber,
                poId,
                projectId,
                receivedById: req.user.id,
                items: {
                    create: items.map((item) => ({
                        materialId: item.materialId,
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true }
        });
        // Update inventory logic
        for (const item of items) {
            const inv = yield prisma_1.default.projectInventory.findFirst({
                where: { projectId, materialId: item.materialId }
            });
            if (inv) {
                yield prisma_1.default.projectInventory.update({
                    where: { id: inv.id },
                    data: { receivedQuantity: { increment: item.quantity } }
                });
            }
            else {
                // Create inventory entry if it doesn't exist
                yield prisma_1.default.projectInventory.create({
                    data: {
                        projectId,
                        materialId: item.materialId,
                        requiredQuantity: 0,
                        reorderLevel: 0,
                        receivedQuantity: item.quantity,
                        consumedQuantity: 0
                    }
                });
            }
        }
        return res.status(201).json(receipt);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating receipt', error });
    }
});
exports.createMaterialReceipt = createMaterialReceipt;
const consumeMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, siteId, materialId, quantity } = req.body;
        const { getAccessibleProject } = require('../utils/projectAccess');
        const project = yield getAccessibleProject(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found or access denied' });
        const consumption = yield prisma_1.default.materialConsumption.create({
            data: {
                projectId,
                siteId,
                materialId,
                quantity,
                usedById: req.user.id
            }
        });
        const inv = yield prisma_1.default.projectInventory.findFirst({
            where: { projectId, materialId }
        });
        if (inv) {
            yield prisma_1.default.projectInventory.update({
                where: { id: inv.id },
                data: { consumedQuantity: { increment: quantity } }
            });
        }
        return res.status(201).json(consumption);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error consuming material', error });
    }
});
exports.consumeMaterial = consumeMaterial;
