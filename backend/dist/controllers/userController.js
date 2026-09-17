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
exports.updateUserStatus = exports.updateUser = exports.createUser = exports.getUsers = exports.getRoles = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditLogger_1 = require("../utils/auditLogger");
const crypto_1 = __importDefault(require("crypto"));
const getRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Roles might be organization specific or global (organizationId null)
        const roles = yield prisma_1.default.role.findMany({
            where: {
                OR: [
                    { organizationId: orgId },
                    { organizationId: null }
                ]
            },
            select: {
                id: true,
                name: true,
                permissions: true
            }
        });
        res.json(roles);
    }
    catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getRoles = getRoles;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const users = yield prisma_1.default.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                createdAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getUsers = getUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const orgId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!orgId || !userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { email, firstName, lastName, roleId } = req.body;
        if (!email || !firstName || !lastName || !roleId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Generate a secure temporary password
        const tempPassword = crypto_1.default.randomBytes(8).toString('hex');
        const passwordHash = yield bcrypt_1.default.hash(tempPassword, 10);
        const newUser = yield prisma_1.default.user.create({
            data: {
                email,
                firstName,
                lastName,
                passwordHash,
                roleId,
                organizationId: orgId,
                status: 'ACTIVE' // In a real flow, this could be INVITED until they log in
            },
        });
        yield (0, auditLogger_1.logAudit)('USER_CREATED', 'User', newUser.id, userId, orgId, { email: newUser.email, roleId });
        // In a real application, send the temporary password via email here
        console.log(`[EMAIL SIMULATION] To: ${email} | Welcome! Your temporary password is: ${tempPassword}`);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
            }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const orgId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const id = req.params.id;
        const { firstName, lastName, roleId } = req.body;
        if (!orgId || !userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Ensure user belongs to the same org
        const targetUser = yield prisma_1.default.user.findFirst({
            where: { id, organizationId: orgId }
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (firstName && { firstName })), (lastName && { lastName })), (roleId && { roleId }))
        });
        yield (0, auditLogger_1.logAudit)('USER_UPDATED', 'User', id, userId, orgId, { fields: Object.keys(req.body) });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateUser = updateUser;
const updateUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const orgId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const id = req.params.id;
        const { status } = req.body; // e.g., 'SUSPENDED', 'DEACTIVATED', 'ACTIVE'
        if (!orgId || !userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!['ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const targetUser = yield prisma_1.default.user.findFirst({
            where: { id, organizationId: orgId }
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Prevent self-deactivation
        if (id === userId) {
            return res.status(400).json({ message: 'Cannot change your own status' });
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id },
            data: { status }
        });
        yield (0, auditLogger_1.logAudit)(`USER_STATUS_CHANGED_${status}`, 'User', id, userId, orgId, { status });
        res.json({ message: `User status updated to ${status}` });
    }
    catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateUserStatus = updateUserStatus;
