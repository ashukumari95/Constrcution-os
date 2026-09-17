import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { storageService } from '../services/storageService';
import { AuditService } from '../services/auditService';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, title, documentType, comments } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId as string, req.user!);
    if (!project) {
      return res.status(403).json({ message: 'Unauthorized project access' });
    }

    // Save physical file
    const { fileUrl, fileName, fileSize, mimeType } = await storageService.uploadFile(file, 'documents');

    // Create DB records
    const document = await prisma.projectDocument.create({
      data: {
        title: title as string,
        category: (documentType as string) || 'Other',
        projectId: projectId as string,
        versions: {
          create: {
            versionNumber: 1,
            fileUrl,
            fileName,
            fileSize,
            mimeType,
            uploadedById: req.user!.id,
            changeDesc: (comments as string) || null
          }
        }
      },
      include: {
        versions: true
      }
    });

    await AuditService.log({
      action: 'DOCUMENT_UPLOADED',
      entity: 'ProjectDocument',
      entityId: document.id,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.status(201).json(document);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId as string;

    const documents = await prisma.projectDocument.findMany({
      where,
      include: {
        project: { select: { name: true, organizationId: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            uploadedBy: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const filtered = documents.filter(d => d.project.organizationId === req.user!.organizationId);
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching documents', error });
  }
};

export const getDocumentHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    const document = await prisma.projectDocument.findUnique({
      where: { id: id as string },
      include: {
        project: true,
        versions: {
          include: {
            uploadedBy: { select: { firstName: true, lastName: true } }
          },
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(document.projectId, req.user!);
    if (!project) return res.status(403).json({ message: 'Unauthorized project access' });

    return res.json(document.versions);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching document history', error });
  }
};

export const uploadNewVersion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await prisma.projectDocument.findUnique({
      where: { id: id as string },
      include: {
        project: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const { getAccessibleProject } = require('../utils/projectAccess');
    const projectAccess = await getAccessibleProject(document.projectId, req.user!);
    if (!projectAccess) return res.status(403).json({ message: 'Unauthorized project access' });

    const { fileUrl, fileName, fileSize, mimeType } = await storageService.uploadFile(file, 'documents');

    const nextVersionNumber = (document.versions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: id as string,
        versionNumber: nextVersionNumber,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        uploadedById: req.user!.id,
        changeDesc: (comments as string) || null
      }
    });

    // Reset status to DRAFT or UNDER_REVIEW on new version
    await prisma.projectDocument.update({
      where: { id: id as string },
      data: { status: 'UNDER_REVIEW' }
    });

    await AuditService.log({
      action: 'DOCUMENT_VERSION_ADDED',
      entity: 'ProjectDocument',
      entityId: document.id,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.status(201).json(newVersion);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error uploading new version', error: error.message });
  }
};

export const approveDocument = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status as string)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const document = await prisma.projectDocument.findUnique({
      where: { id: id as string },
      include: { project: true }
    });

    if (!document || document.project.organizationId !== req.user!.organizationId) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Role check
    const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'];
    if (!allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({ message: 'Unauthorized to approve documents' });
    }

    const updated = await prisma.projectDocument.update({
      where: { id: id as string },
      data: {
        status: status as string
      }
    });

    await AuditService.log({
      action: `DOCUMENT_${status}`,
      entity: 'ProjectDocument',
      entityId: id as string,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error approving document', error });
  }
};
