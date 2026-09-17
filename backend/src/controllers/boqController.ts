import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { getAccessibleProject } from '../utils/projectAccess';

export const getBoqItems = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const items = await prisma.boqItem.findMany({ where: { projectId } });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching BOQ items', error });
  }
};

export const createBoqItem = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const { itemCode, description, category, unit, quantity, rate } = req.body;
    
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const estimatedAmount = quantity * rate;

    const item = await prisma.boqItem.create({
      data: {
        projectId,
        itemCode,
        description,
        category,
        unit,
        quantity,
        rate,
        estimatedAmount
      }
    });
    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating BOQ item', error });
  }
};
