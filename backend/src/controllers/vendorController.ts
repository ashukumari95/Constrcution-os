import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAudit } from '../utils/auditLogger';

const prisma = new PrismaClient();

export const getVendors = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createVendor = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, contactPerson, email, phone } = req.body;

    const vendor = await prisma.vendor.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        organizationId: req.user!.organizationId
      }
    });

    await logAudit(
      'CREATE',
      'Vendor',
      vendor.id,
      req.user!.id,
      req.user!.organizationId,
      { name: vendor.name }
    );

    return res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
