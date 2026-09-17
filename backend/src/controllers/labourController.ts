import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getWorkers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, contractorId } = req.query;
    
    const where: any = { organizationId: req.user!.organizationId };
    if (projectId) where.projectId = projectId;
    if (contractorId) where.contractorId = contractorId;

    const workers = await prisma.worker.findMany({
      where,
      include: {
        contractor: { select: { companyName: true } },
        project: { select: { name: true } }
      }
    });
    return res.json(workers);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching workers', error });
  }
};

export const createWorker = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, category, type, dailyRate, projectId, contractorId } = req.body;
    
    if (projectId) {
      const { getAccessibleProject } = require('../utils/projectAccess');
      const project = await getAccessibleProject(projectId, req.user!);
      if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const worker = await prisma.worker.create({
      data: {
        firstName,
        lastName,
        category,
        type,
        dailyRate,
        projectId,
        contractorId,
        organizationId: req.user!.organizationId
      }
    });

    return res.status(201).json(worker);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating worker', error });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, siteId, date } = req.query;
    
    // Project isolation check: user must be member of project if projectId is provided
    // (Assuming simple organization isolation for this controller for now)
    
    const where: any = { 
      worker: { organizationId: req.user!.organizationId }
    };
    if (projectId) where.projectId = projectId;
    if (siteId) where.siteId = siteId;
    if (date) {
        const d = new Date(date as string);
        d.setHours(0,0,0,0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);
        where.date = { gte: d, lt: nextD };
    }

    const attendance = await prisma.labourAttendance.findMany({
      where,
      include: {
        worker: { select: { firstName: true, lastName: true, category: true, type: true } }
      }
    });
    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching attendance', error });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { date, records, projectId, siteId } = req.body;
    // records: { workerId, status }[]
    
    if (projectId) {
      const { getAccessibleProject } = require('../utils/projectAccess');
      const project = await getAccessibleProject(projectId, req.user!);
      if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    const dateObj = new Date(date);
    
    const results = [];
    for (const rec of records) {
        // Upsert based on workerId, date
        const attendance = await prisma.labourAttendance.create({
            data: {
                date: dateObj,
                status: rec.status,
                workerId: rec.workerId,
                projectId,
                siteId
            }
        });
        results.push(attendance);
    }

    return res.status(201).json({ message: 'Attendance marked', count: results.length });
  } catch (error) {
    return res.status(500).json({ message: 'Error marking attendance', error });
  }
};
