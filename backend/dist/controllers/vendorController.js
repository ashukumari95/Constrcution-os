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
exports.createVendor = exports.getVendors = void 0;
const client_1 = require("@prisma/client");
const auditLogger_1 = require("../utils/auditLogger");
const prisma = new client_1.PrismaClient();
const getVendors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendors = yield prisma.vendor.findMany({
            where: { organizationId: req.user.organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(vendors);
    }
    catch (error) {
        console.error('Error fetching vendors:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.getVendors = getVendors;
const createVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, contactPerson, email, phone } = req.body;
        const vendor = yield prisma.vendor.create({
            data: {
                name,
                contactPerson,
                email,
                phone,
                organizationId: req.user.organizationId
            }
        });
        yield (0, auditLogger_1.logAudit)('CREATE', 'Vendor', vendor.id, req.user.id, req.user.organizationId, { name: vendor.name });
        return res.status(201).json(vendor);
    }
    catch (error) {
        console.error('Error creating vendor:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.createVendor = createVendor;
