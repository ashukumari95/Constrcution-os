import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getOrganizationConfig = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const org = await prisma.organization.findUnique({
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
  } catch (error) {
    console.error('Error fetching organization config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrganizationConfig = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const organizationId = req.user?.organizationId;
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

    const data: any = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data,
    });

    res.status(200).json(org);
  } catch (error) {
    console.error('Error updating organization config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
