import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { storageService, ALLOWED_MIMES } from '../services/storageService';
import { AuditService } from '../services/auditService';

export const uploadSitePhoto = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, siteId, description, location, taskId, issueId, dprId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId as string, req.user!);
    if (!project) {
      return res.status(403).json({ message: 'Unauthorized project access' });
    }

    // Save physical file
    const { fileUrl } = await storageService.uploadFile(
      file,
      'photos'
    );

    const photo = await prisma.sitePhoto.create({
      data: {
        url: fileUrl,
        description,
        location,
        projectId: projectId as string,
        siteId: siteId ? (siteId as string) : null,
        taskId: taskId ? (taskId as string) : null,
        issueId: issueId ? (issueId as string) : null,
        dprId: dprId ? (dprId as string) : null,
        uploaderId: req.user!.id
      }
    });

    await AuditService.log({
      action: 'PHOTO_UPLOADED',
      entity: 'SitePhoto',
      entityId: photo.id,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.status(201).json(photo);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
};

export const getSitePhotos = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, siteId, taskId, issueId, dprId } = req.query;
    const where: any = {};
    
    if (projectId) where.projectId = projectId as string;
    if (siteId) where.siteId = siteId as string;
    if (taskId) where.taskId = taskId as string;
    if (issueId) where.issueId = issueId as string;
    if (dprId) where.dprId = dprId as string;

    const photos = await prisma.sitePhoto.findMany({
      where,
      include: {
        uploader: { select: { firstName: true, lastName: true } },
        project: { select: { name: true, organizationId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const filtered = photos.filter(p => p.project.organizationId === req.user!.organizationId);
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching photos', error });
  }
};
