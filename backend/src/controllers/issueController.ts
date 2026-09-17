import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { AuditService } from '../services/auditService';

export const getIssues = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId as string;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        reportedBy: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        project: { select: { name: true, organizationId: true } },
        comments: {
          include: {
            author: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        photos: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const filtered = issues.filter(i => i.project.organizationId === req.user!.organizationId);
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching issues', error });
  }
};

export const createIssue = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, description, type, priority, projectId, siteId, assignedToId, location, dueDate } = req.body;
    
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId as string, req.user!);
    if (!project) {
      return res.status(403).json({ message: 'Unauthorized project access' });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        type: type || 'GENERAL',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        location,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId as string,
        siteId: siteId || null,
        reportedById: req.user!.id,
        assignedToId: assignedToId || null
      }
    });

    await AuditService.log({
      action: 'ISSUE_CREATED',
      entity: 'Issue',
      entityId: issue.id,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.status(201).json(issue);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating issue', error });
  }
};

export const updateIssue = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, description, priority, type, status, assignedToId, resolution, location, dueDate } = req.body;

    const existingIssue = await prisma.issue.findUnique({
      where: { id: id as string },
      include: { project: true }
    });

    if (!existingIssue || existingIssue.project.organizationId !== req.user!.organizationId) {
      return res.status(404).json({ message: 'Issue not found or unauthorized' });
    }

    const updateData: any = {
      title,
      description,
      priority,
      type,
      status,
      assignedToId,
      location,
      dueDate: dueDate ? new Date(dueDate) : existingIssue.dueDate
    };

    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }

    const issue = await prisma.issue.update({
      where: { id: id as string },
      data: updateData
    });

    if (status && status !== existingIssue.status) {
      await AuditService.log({
        action: `ISSUE_STATUS_CHANGED_${status}`,
        entity: 'Issue',
        entityId: issue.id,
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
      });
    }

    return res.json(issue);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating issue', error });
  }
};

export const addIssueComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { text } = req.body; // was 'content', model uses 'text'

    const existingIssue = await prisma.issue.findUnique({
      where: { id: id as string },
      include: { project: true }
    });

    if (!existingIssue || existingIssue.project.organizationId !== req.user!.organizationId) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const comment = await prisma.issueComment.create({
      data: {
        text,
        issueId: id as string,
        authorId: req.user!.id
      },
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });

    await AuditService.log({
      action: 'ISSUE_COMMENT_ADDED',
      entity: 'Issue',
      entityId: id as string,
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding comment', error });
  }
};
