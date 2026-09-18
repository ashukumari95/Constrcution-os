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
exports.getTenantBranding = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const auditLogger_1 = require("../utils/auditLogger");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, firstName, lastName, organizationName } = req.body;
        if (!email || !password || !firstName || !lastName || !organizationName) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        // Run within a transaction
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Generate subdomain
            const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let subdomain = slug;
            let counter = 0;
            while (true) {
                const existing = yield tx.organization.findUnique({ where: { subdomain } });
                if (!existing)
                    break;
                counter++;
                subdomain = `${slug}-${counter}`;
            }
            // 1. Create Organization
            const trialDurationDays = parseInt(process.env.TRIAL_DURATION_DAYS || '14', 10);
            const trialStartedAt = new Date();
            const trialEndsAt = new Date(trialStartedAt.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);
            const org = yield tx.organization.create({
                data: {
                    name: organizationName,
                    subdomain,
                    subscriptionStatus: 'TRIAL',
                    plan: 'TRIAL',
                    trialStartedAt,
                    trialEndsAt
                }
            });
            // 2. Fetch or Create the COMPANY_ADMIN role (system-wide)
            let role = yield tx.role.findFirst({
                where: { name: 'COMPANY_ADMIN', organizationId: null }
            });
            if (!role) {
                role = yield tx.role.create({
                    data: {
                        name: 'COMPANY_ADMIN',
                        permissions: JSON.stringify(['*']), // Admin gets all permissions by default
                        organizationId: null // System role
                    }
                });
            }
            // 3. Create User
            const user = yield tx.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    organizationId: org.id,
                    roleId: role.id,
                    status: 'ACTIVE'
                },
                include: { role: true, organization: true }
            });
            return user;
        }));
        const token = jsonwebtoken_1.default.sign({
            id: result.id,
            email: result.email,
            organizationId: result.organizationId,
            roleId: result.roleId
        }, process.env.JWT_SECRET || 'super-secret-jwt-key-for-development', { expiresIn: '1d' });
        yield (0, auditLogger_1.logAudit)('REGISTER', 'User', result.id, result.id, result.organizationId, { email });
        res.status(201).json({
            token,
            user: {
                id: result.id,
                email: result.email,
                firstName: result.firstName,
                lastName: result.lastName,
                organizationId: result.organizationId,
                organizationName: result.organization.name,
                organizationSubdomain: result.organization.subdomain,
                role: result.role.name,
                permissions: JSON.parse(result.role.permissions || '[]')
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
            include: {
                role: true,
                organization: true
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: `User account is ${user.status.toLowerCase()}` });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roleId: user.roleId
        }, process.env.JWT_SECRET || 'super-secret-jwt-key-for-development', { expiresIn: '1d' });
        let computedSubscriptionStatus = user.organization.subscriptionStatus;
        if (computedSubscriptionStatus === 'TRIAL' &&
            user.organization.trialEndsAt &&
            new Date() > user.organization.trialEndsAt) {
            computedSubscriptionStatus = 'TRIAL_EXPIRED';
        }
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
                role: user.role.name,
                permissions: JSON.parse(user.role.permissions || '[]'),
                subscriptionStatus: computedSubscriptionStatus,
                trialStartedAt: user.organization.trialStartedAt,
                trialEndsAt: user.organization.trialEndsAt,
            }
        });
        // Log successful login
        yield (0, auditLogger_1.logAudit)('LOGIN', 'User', user.id, user.id, user.organizationId, { email });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            include: {
                role: true,
                organization: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let computedSubscriptionStatus = user.organization.subscriptionStatus;
        if (computedSubscriptionStatus === 'TRIAL' &&
            user.organization.trialEndsAt &&
            new Date() > user.organization.trialEndsAt) {
            computedSubscriptionStatus = 'TRIAL_EXPIRED';
        }
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            role: user.role.name,
            permissions: JSON.parse(user.role.permissions || '[]'),
            subscriptionStatus: computedSubscriptionStatus,
            trialStartedAt: user.organization.trialStartedAt,
            trialEndsAt: user.organization.trialEndsAt,
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getMe = getMe;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email is required' });
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Return 200 to prevent email enumeration
            return res.json({ message: 'If an account exists, a password reset link has been sent.' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedResetToken = yield bcrypt_1.default.hash(resetToken, 10);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedResetToken,
                resetTokenExpiry
            }
        });
        // In a real app, send email here. For Phase 2, we simulate it via console log.
        console.log(`[EMAIL SIMULATION] To: ${email} | Password Reset Link: http://localhost:5173/reset-password?token=${resetToken}&email=${email}`);
        yield (0, auditLogger_1.logAudit)('FORGOT_PASSWORD_REQUESTED', 'User', user.id, user.id, user.organizationId, { email });
        res.json({ message: 'If an account exists, a password reset link has been sent.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        if (user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        const isTokenValid = yield bcrypt_1.default.compare(token, user.resetToken);
        if (!isTokenValid) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        const passwordHash = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        yield (0, auditLogger_1.logAudit)('PASSWORD_RESET', 'User', user.id, user.id, user.organizationId, { email });
        res.json({ message: 'Password has been successfully reset' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.resetPassword = resetPassword;
const getTenantBranding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostname, slug } = req.query;
        if (!hostname && !slug) {
            return res.status(400).json({ message: 'Hostname or slug is required' });
        }
        let subdomain = '';
        if (slug && typeof slug === 'string') {
            subdomain = slug;
        }
        else if (hostname && typeof hostname === 'string') {
            // Basic subdomain extraction (assumes first part of hostname is subdomain if it has more than 1 dot, or if it's .localhost)
            if (hostname.includes('.localhost')) {
                subdomain = hostname.split('.localhost')[0];
            }
            else {
                const parts = hostname.split('.');
                if (parts.length >= 3) {
                    subdomain = parts[0];
                }
            }
        }
        if (!subdomain) {
            return res.status(404).json({ message: 'No tenant found' });
        }
        if (subdomain === 'admin') {
            return res.json({
                id: 'admin',
                name: 'ConstructionOS Administration',
                isSuperAdmin: true,
                logoUrl: null, // Default platform logo
                primaryColor: '#0f172a' // Slate 900
            });
        }
        const orConditions = [{ subdomain }];
        if (hostname && typeof hostname === 'string') {
            orConditions.push({ customDomain: hostname });
        }
        const org = yield prisma_1.default.organization.findFirst({
            where: {
                OR: orConditions
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                faviconUrl: true,
                primaryColor: true,
                secondaryColor: true,
                loginBackground: true
            }
        });
        if (!org) {
            return res.status(404).json({ message: 'No tenant found' });
        }
        res.json(org);
    }
    catch (error) {
        console.error('getTenantBranding error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getTenantBranding = getTenantBranding;
