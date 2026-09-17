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
exports.getAccessibleProject = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const getAccessibleProject = (projectId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isClient = user.role === 'CLIENT' || user.permissions.includes('client.dashboard.view');
    let whereClause = { id: projectId };
    if (!isSuperAdmin) {
        whereClause.organizationId = user.organizationId;
    }
    if (isClient) {
        whereClause.members = {
            some: { userId: user.id }
        };
    }
    return yield prisma_1.default.project.findFirst({ where: whereClause });
});
exports.getAccessibleProject = getAccessibleProject;
