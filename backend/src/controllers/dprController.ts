import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { AuditService } from '../services/auditService';

export const getDPRs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId as string;

    const dprs = await prisma.dailyProgressReport.findMany({
      where,
      include: {
        preparedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
        project: { select: { name: true, organizationId: true } }
      },
      orderBy: { date: 'desc' }
    });

    const filtered = dprs.filter(d => d.project.organizationId === req.user!.organizationId);
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching DPRs', error });
  }
};

export const createDPR = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { 
      date, manpowerCount, workCompleted, issues, nextDayPlan, projectId, siteId, 
      weather, equipment, quantities, materialReceived, materialConsumed, safetyObservations, status 
    } = req.body;
    
    // Validate project access
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId as string, req.user!);
    if (!project) {
      return res.status(403).json({ message: 'Unauthorized project access' });
    }

    const dpr = await prisma.dailyProgressReport.create({
      data: {
        date: new Date(date),
        manpowerCount,
        workCompleted,
        issues,
        nextDayPlan,
        status: status || 'DRAFT', // Site Engineer creates draft
        weather,
        equipment: equipment ? equipment : null,
        quantities: quantities ? quantities : null,
        materialReceived: materialReceived ? materialReceived : null,
        materialConsumed: materialConsumed ? materialConsumed : null,
        safetyObservations,
        projectId: projectId as string,
        siteId: siteId ? (siteId as string) : null,
        preparedById: req.user!.id
      }
    });

    if (dpr.status === 'SUBMITTED') {
      await AuditService.log({
        action: 'DPR_SUBMITTED',
        entity: 'DailyProgressReport',
        entityId: dpr.id,
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
      });
    }

    return res.status(201).json(dpr);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating DPR', error });
  }
};

export const updateDPR = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { 
      manpowerCount, workCompleted, issues, nextDayPlan, weather, 
      equipment, quantities, materialReceived, materialConsumed, 
      safetyObservations, status, rejectionReason 
    } = req.body;

    const existingDpr = await prisma.dailyProgressReport.findUnique({
      where: { id: id as string },
      include: { project: true }
    });

    if (!existingDpr || existingDpr.project.organizationId !== req.user!.organizationId) {
      return res.status(404).json({ message: 'DPR not found or unauthorized' });
    }

    // Role check for approvals
    const isApprovalAction = status === 'APPROVED' || status === 'REJECTED';
    if (isApprovalAction) {
      const userRole = req.user!.role; 
      const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'You do not have permission to approve/reject DPRs' });
      }
    }

    const updateData: any = {
      manpowerCount,
      workCompleted,
      issues,
      nextDayPlan,
      status,
      weather,
      equipment: equipment !== undefined ? equipment : existingDpr.equipment,
      quantities: quantities !== undefined ? quantities : existingDpr.quantities,
      materialReceived: materialReceived !== undefined ? materialReceived : existingDpr.materialReceived,
      materialConsumed: materialConsumed !== undefined ? materialConsumed : existingDpr.materialConsumed,
      safetyObservations
    };

    if (isApprovalAction && existingDpr.status !== status) {
      updateData.approvedById = req.user!.id;
      updateData.approvedAt = new Date();
      if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason;
      }
    }

    const dpr = await prisma.dailyProgressReport.update({
      where: { id: id as string },
      data: updateData
    });

    // Audit logs for status changes
    if (status && status !== existingDpr.status) {
      await AuditService.log({
        action: `DPR_${status}`, // e.g. DPR_APPROVED
        entity: 'DailyProgressReport',
        entityId: dpr.id,
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
      });
    }

    return res.json(dpr);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating DPR', error });
  }
};
