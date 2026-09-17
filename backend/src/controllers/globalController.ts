import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getGlobalTasks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };
    
    const tasks = await prisma.task.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global tasks', error });
  }
};

export const getGlobalBoq = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const items = await prisma.boqItem.findMany({
      where: { project: orgWhere },
      include: { project: { select: { id: true, name: true } } }
    });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global BOQ', error });
  }
};

export const getGlobalProcurement = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const requests = await prisma.purchaseRequest.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global procurement', error });
  }
};

export const getGlobalIssues = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const issues = await prisma.issue.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global issues', error });
  }
};

export const getGlobalLabour = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const labour = await prisma.worker.findMany({
      where: orgWhere,
      include: { 
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, companyName: true } }
      }
    });
    return res.json(labour);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global labour', error });
  }
};

export const getGlobalDpr = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const dprs = await prisma.dailyProgressReport.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { date: 'desc' }
    });
    return res.json(dprs);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global dprs', error });
  }
};

export const getGlobalFinance = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const invoices = await prisma.invoice.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global finance', error });
  }
};

export const getGlobalDocuments = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const documents = await prisma.projectDocument.findMany({
      where: { project: orgWhere },
      include: { 
        project: { select: { id: true, name: true } }
      }
    });
    return res.json(documents);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global documents', error });
  }
};

export const getGlobalUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const orgWhere = isSuperAdmin ? {} : { organizationId: req.user!.organizationId };

    const users = await prisma.user.findMany({
      where: orgWhere,
      include: { 
        role: { select: { id: true, name: true } }
      }
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global users', error });
  }
};
