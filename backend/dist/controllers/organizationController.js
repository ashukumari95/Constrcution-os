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
exports.updateOrganizationConfig = exports.getOrganizationConfig = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getOrganizationConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const org = yield prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                status: true,
                companyType: true,
                country: true,
                timezone: true,
                currency: true,
                address: true,
                contactInfo: true,
                defaultProjectStatus: true,
                financialSettings: true,
                dateFormat: true,
                units: true,
                taxConfiguration: true,
                plan: true,
                subscriptionStatus: true,
                userLimit: true,
                projectLimit: true,
                storageLimit: true,
                featureEntitlements: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        res.status(200).json(org);
    }
    catch (error) {
        console.error('Error fetching organization config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getOrganizationConfig = getOrganizationConfig;
const updateOrganizationConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Only allow specific fields to be updated via frontend
        const allowedUpdates = [
            'name', 'companyType', 'country', 'timezone', 'currency', 'address',
            'contactInfo', 'defaultProjectStatus', 'financialSettings',
            'dateFormat', 'units', 'taxConfiguration'
        ];
        const data = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                data[key] = req.body[key];
            }
        }
        const org = yield prisma.organization.update({
            where: { id: organizationId },
            data,
        });
        res.status(200).json(org);
    }
    catch (error) {
        console.error('Error updating organization config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateOrganizationConfig = updateOrganizationConfig;
