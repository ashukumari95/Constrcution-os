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
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.default.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to 50 recent notifications
        });
        return res.json(notifications);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching notifications', error });
    }
});
exports.getNotifications = getNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma_1.default.notification.findUnique({
            where: { id: id }
        });
        if (!notification || notification.userId !== req.user.id) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        const updated = yield prisma_1.default.notification.update({
            where: { id: id },
            data: { isRead: true }
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error marking notification as read', error });
    }
});
exports.markAsRead = markAsRead;
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        return res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error marking all as read', error });
    }
});
exports.markAllAsRead = markAllAsRead;
