import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { LocalStorageProvider } from '../providers/LocalStorageProvider';

const prisma = new PrismaClient();
const storage = new LocalStorageProvider();

export const uploadImportFile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { module, batchId } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!module) {
      res.status(400).json({ error: 'Module is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Basic Validation
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      res.status(400).json({ error: 'Only CSV or XLSX files are allowed' });
      return;
    }

    // Upload file
    const storageDir = `imports/${organizationId}/${module}`;
    const sourcePath = await storage.upload(req.file, storageDir);

    // Create ImportJob record
    const importJob = await prisma.importJob.create({
      data: {
        module,
        filename: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        sourcePath,
        batchId: batchId || null,
        status: 'UPLOADED',
        organizationId,
        userId,
      }
    });

    res.status(201).json({ message: 'File uploaded successfully', importJob });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getImportJobs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const jobs = await prisma.importJob.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching import jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
