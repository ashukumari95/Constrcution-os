import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

// Get risks for a specific project
export const getProjectRisks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params as { projectId: string };
    const risks = await prisma.projectRisk.findMany({
      where: { projectId },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        reportedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { riskScore: 'desc' }
    });
    return res.json(risks);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching project risks', error });
  }
};

// Get all risks across portfolio (for Executive Dashboard)
export const getAllRisks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orgId = req.user!.organizationId;
    const risks = await prisma.projectRisk.findMany({
      where: { project: { organizationId: orgId } },
      include: {
        project: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } }
      },
      orderBy: { riskScore: 'desc' }
    });
    return res.json(risks);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching global risks', error });
  }
};

export const createRisk = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params as { projectId: string };
    const {
      title,
      description,
      category,
      severity,
      probability,
      impact,
      dueDate,
      targetResolutionDate,
      mitigationPlan,
      contingencyPlan,
      ownerId
    } = req.body;

    const riskScore = probability * impact;

    const riskCode = `RSK-${Math.floor(1000 + Math.random() * 9000)}`; // Simple code generator

    const risk = await prisma.projectRisk.create({
      data: {
        projectId,
        riskCode,
        title,
        description,
        category,
        severity,
        probability,
        impact,
        riskScore,
        dueDate: dueDate ? new Date(dueDate) : null,
        targetResolutionDate: targetResolutionDate ? new Date(targetResolutionDate) : null,
        mitigationPlan,
        contingencyPlan,
        ownerId,
        reportedById: req.user!.id
      }
    });
    return res.status(201).json(risk);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating risk', error });
  }
};

export const updateRisk = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const projectId = req.query.projectId as string | undefined;

    // Recalculate score if prob or impact changes
    if (data.probability !== undefined || data.impact !== undefined) {
      const existing = await prisma.projectRisk.findUnique({ where: { id } });
      if (existing) {
        const p = data.probability ?? existing.probability;
        const i = data.impact ?? existing.impact;
        data.riskScore = p * i;
      }
    }

    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.targetResolutionDate) data.targetResolutionDate = new Date(data.targetResolutionDate);
    
    data.updatedById = req.user!.id;

    const risk = await prisma.projectRisk.update({
      where: { id },
      data
    });
    return res.json(risk);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating risk', error });
  }
};

export const deleteRisk = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.projectRisk.delete({ where: { id } });
    return res.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting risk', error });
  }
};
