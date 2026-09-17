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
exports.authorize = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'No token provided' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-for-development', (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            return res.status(403).json({ message: 'Invalid token' });
        try {
            // We could also cache this or only rely on the JWT payload.
            // For maximum security and live role updates, we fetch the role from the DB.
            const user = yield prisma_1.default.user.findUnique({
                where: { id: decoded.id },
                include: { role: true, organization: true },
            });
            if (!user)
                return res.status(404).json({ message: 'User not found' });
            if (user.status !== 'ACTIVE') {
                return res.status(403).json({ message: 'User account is not active' });
            }
            let computedSubscriptionStatus = user.organization.subscriptionStatus || 'ACTIVE';
            if (computedSubscriptionStatus === 'TRIAL' &&
                user.organization.trialEndsAt &&
                new Date() > user.organization.trialEndsAt) {
                computedSubscriptionStatus = 'TRIAL_EXPIRED';
            }
            req.user = {
                id: user.id,
                email: user.email,
                organizationId: user.organizationId,
                roleId: user.roleId,
                role: user.role.name,
                permissions: JSON.parse(user.role.permissions || '[]'),
                subscriptionStatus: computedSubscriptionStatus,
            };
            next();
        }
        catch (dbError) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }));
});
exports.authenticateToken = authenticateToken;
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Trial Expiration Enforcement (Block mutations)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            if (req.user.subscriptionStatus === 'TRIAL_EXPIRED' && req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Forbidden: Your free trial has ended. Workspace is read-only.' });
            }
        }
        // Super admin bypass or explicit check
        if (req.user.permissions.includes('all') || req.user.permissions.includes('*') || req.user.permissions.includes(requiredPermission)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
    };
};
exports.requirePermission = requirePermission;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (allowedRoles.includes(req.user.role)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
    };
};
exports.authorize = authorize;
