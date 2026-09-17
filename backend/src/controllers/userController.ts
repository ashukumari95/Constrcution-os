import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAudit } from '../utils/auditLogger';
import crypto from 'crypto';

export const getRoles = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    // Roles might be organization specific or global (organizationId null)
    const roles = await prisma.role.findMany({
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
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.id;
    if (!orgId || !userId) return res.status(401).json({ message: 'Unauthorized' });

    const { email, firstName, lastName, roleId } = req.body;

    if (!email || !firstName || !lastName || !roleId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
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

    await logAudit('USER_CREATED', 'User', newUser.id, userId, orgId, { email: newUser.email, roleId });

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

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.id;
    const id = (req.params.id as string) as string;
    const { firstName, lastName, roleId } = req.body;

    if (!orgId || !userId) return res.status(401).json({ message: 'Unauthorized' });

    // Ensure user belongs to the same org
    const targetUser = await prisma.user.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(roleId && { roleId }),
      }
    });

    await logAudit('USER_UPDATED', 'User', id, userId, orgId, { fields: Object.keys(req.body) });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.id;
    const id = (req.params.id as string) as string;
    const { status } = req.body; // e.g., 'SUSPENDED', 'DEACTIVATED', 'ACTIVE'

    if (!orgId || !userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!['ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deactivation
    if (id === userId) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status }
    });

    await logAudit(`USER_STATUS_CHANGED_${status}`, 'User', id, userId, orgId, { status });

    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
