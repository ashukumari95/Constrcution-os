import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getMaterials = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const materials = await prisma.material.findMany({
      where: { organizationId: req.user!.organizationId }
    });
    return res.json(materials);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching materials', error });
  }
};

export const createMaterial = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, code, category, unit } = req.body;
    
    const material = await prisma.material.create({
      data: {
        name,
        code,
        category,
        unit,
        organizationId: req.user!.organizationId
      }
    });

    return res.status(201).json(material);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating material', error });
  }
};

export const getInventory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    // Validate project ownership
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId as string, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const inventory = await prisma.projectInventory.findMany({
      where: { projectId: projectId as string },
      include: {
        material: true
      }
    });
    
    // Calculate derived available quantity on the fly for response
    const enrichedInventory = inventory.map(inv => ({
        ...inv,
        availableQuantity: inv.receivedQuantity - inv.consumedQuantity
    }));
    
    return res.json(enrichedInventory);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching inventory', error });
  }
};

export const addInventoryItem = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { projectId, materialId, requiredQuantity, reorderLevel } = req.body;
  
      // Project isolation check
      const { getAccessibleProject } = require('../utils/projectAccess');
      const project = await getAccessibleProject(projectId as string, req.user!);
      if (!project) return res.status(404).json({ message: 'Project not found' });
  
      const inventory = await prisma.projectInventory.create({
        data: {
          projectId,
          materialId,
          requiredQuantity,
          reorderLevel,
          receivedQuantity: 0,
          consumedQuantity: 0
        }
      });
  
      return res.status(201).json(inventory);
    } catch (error) {
      return res.status(500).json({ message: 'Error adding inventory item', error });
    }
};
