import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { storageService } from '../services/storageService';
import { getAccessibleProject } from '../utils/projectAccess';

export const getTasks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        dependencies: true,
        dependentOn: true,
        checklist: true,
        attachments: true
      }
    });
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const { title, description, priority, dueDate, wbsElementId, assigneeId } = req.body;
    
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        wbsElementId,
        assigneeId
      },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } }
    });
    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating task', error });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const task = await prisma.task.update({
      where: { id },
      data: { status }
    });
    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task', error });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const taskId = req.params.taskId as string;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const task = await prisma.task.findUnique({ where: { id: taskId }});
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { fileUrl } = await storageService.uploadFile(file, `tasks`);

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedById: req.user!.id
      }
    });

    return res.status(201).json({ ...attachment, fullUrl: storageService.getFileUrl(fileUrl) });
  } catch (error) {
    return res.status(500).json({ message: 'Error uploading attachment', error });
  }
};
