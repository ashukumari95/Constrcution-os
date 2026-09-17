import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { getAccessibleProject } from '../utils/projectAccess';

export const getWbsElements = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const elements = await prisma.wbsElement.findMany({
      where: { projectId },
      include: { children: true }
    });
    return res.json(elements);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching WBS', error });
  }
};

export const createWbsElement = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const { name, parentId, startDate, endDate, responsibleName } = req.body;
    
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const element = await prisma.wbsElement.create({
      data: {
        projectId,
        name,
        parentId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        responsibleName
      }
    });
    return res.status(201).json(element);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating WBS element', error });
  }
};
