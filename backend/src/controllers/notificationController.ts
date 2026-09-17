import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 recent notifications
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: id as string }
    });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error marking notification as read', error });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Error marking all as read', error });
  }
};
