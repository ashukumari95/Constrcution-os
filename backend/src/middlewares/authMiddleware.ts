import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    roleId: string;
    role: string;
    permissions: string[];
    subscriptionStatus?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-for-development', async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    try {
      // We could also cache this or only rely on the JWT payload.
      // For maximum security and live role updates, we fetch the role from the DB.
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true, organization: true },
      });

      if (!user) return res.status(404).json({ message: 'User not found' });
      
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'User account is not active' });
      }

      let computedSubscriptionStatus = user.organization.subscriptionStatus || 'ACTIVE';
      if (
        computedSubscriptionStatus === 'TRIAL' && 
        user.organization.trialEndsAt && 
        new Date() > user.organization.trialEndsAt
      ) {
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
    } catch (dbError) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
};

export const requirePermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
  };
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
  };
};
