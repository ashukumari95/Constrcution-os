import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { getAccessibleProject } from '../utils/projectAccess';

export const getSitesByProject = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    
    // Verify project access
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const sites = await prisma.site.findMany({
      where: { projectId },
      include: { siteManager: { select: { id: true, firstName: true, lastName: true } } }
    });
    return res.json(sites);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching sites', error });
  }
};

export const createSite = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const { name, location, status, startDate, notes, siteManagerId } = req.body;
    
    // Verify project access
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const site = await prisma.site.create({
      data: {
        projectId,
        name,
        location,
        status,
        startDate: startDate ? new Date(startDate) : null,
        notes,
        siteManagerId
      }
    });
    return res.status(201).json(site);
  } catch (error) {
    console.error("Site creation error:", error);
    return res.status(500).json({ message: 'Error creating site', error });
  }
};
