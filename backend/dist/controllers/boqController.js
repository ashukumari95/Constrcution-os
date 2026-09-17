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
exports.createBoqItem = exports.getBoqItems = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const projectAccess_1 = require("../utils/projectAccess");
const getBoqItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const items = yield prisma_1.default.boqItem.findMany({ where: { projectId } });
        return res.json(items);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching BOQ items', error });
    }
});
exports.getBoqItems = getBoqItems;
const createBoqItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const { itemCode, description, category, unit, quantity, rate } = req.body;
        const project = yield (0, projectAccess_1.getAccessibleProject)(projectId, req.user);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const estimatedAmount = quantity * rate;
        const item = yield prisma_1.default.boqItem.create({
            data: {
                projectId,
                itemCode,
                description,
                category,
                unit,
                quantity,
                rate,
                estimatedAmount
            }
        });
        return res.status(201).json(item);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating BOQ item', error });
    }
});
exports.createBoqItem = createBoqItem;
