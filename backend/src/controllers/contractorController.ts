import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getContractors = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const contractors = await prisma.contractor.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        projects: { select: { id: true, name: true } },
        workers: { select: { id: true } }
      }
    });
    return res.json(contractors);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching contractors', error });
  }
};

export const getContractorById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const contractor = await prisma.contractor.findFirst({
      where: { 
        id: req.params.id as string,
        organizationId: req.user!.organizationId
      },
      include: {
        projects: { select: { id: true, name: true, status: true } },
        workers: true
      }
    });

    if (!contractor) return res.status(404).json({ message: 'Contractor not found' });
    return res.json(contractor);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching contractor', error });
  }
};

export const createContractor = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { companyName, contactPerson, email, phone, contractValue, projectIds } = req.body;
    
    if (projectIds && projectIds.length > 0) {
      const { getAccessibleProject } = require('../utils/projectAccess');
      for (const pid of projectIds) {
        const project = await getAccessibleProject(pid, req.user!);
        if (!project) return res.status(404).json({ message: `Project ${pid} not found or access denied` });
      }
    }

    const contractor = await prisma.contractor.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        contractValue,
        organizationId: req.user!.organizationId,
        projects: projectIds ? { connect: projectIds.map((id: string) => ({ id })) } : undefined
      }
    });

    return res.status(201).json(contractor);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating contractor', error });
  }
};

export const updateContractor = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ message: 'Organization ID is required' });
    }
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Contractor ID is required' });
    }

    const { companyName, contactPerson, email, phone, contractValue, projectIds } = req.body;
    
    // Verify ownership
    const existing = await prisma.contractor.findFirst({ where: { id, organizationId }});
    if (!existing) return res.status(404).json({ message: 'Contractor not found' });

    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        contractValue,
        projects: projectIds ? { set: projectIds.map((id: string) => ({ id })) } : undefined
      }
    });
    return res.json(contractor);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating contractor', error });
  }
};
