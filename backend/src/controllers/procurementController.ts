import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const getPurchaseRequests = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const prs = await prisma.purchaseRequest.findMany({
      where,
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
        project: { select: { name: true, organizationId: true } },
        items: { include: { material: true } }
      }
    });

    // Filter by organization
    const filteredPrs = prs.filter(pr => pr.project.organizationId === req.user!.organizationId);

    return res.json(filteredPrs);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching purchase requests', error });
  }
};

export const createPurchaseRequest = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { prNumber, projectId, siteId, items } = req.body;
    // items: { materialId, quantity }[]

    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const pr = await prisma.purchaseRequest.create({
      data: {
        prNumber,
        projectId,
        siteId,
        requestedById: req.user!.id,
        status: 'PENDING',
        items: {
            create: items.map((item: any) => ({
                materialId: item.materialId,
                quantity: item.quantity
            }))
        }
      },
      include: { items: true }
    });

    return res.status(201).json(pr);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating purchase request', error });
  }
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        project: { select: { name: true, organizationId: true } },
        items: { include: { material: true } }
      }
    });

    const filteredPos = pos.filter(po => po.project.organizationId === req.user!.organizationId);
    return res.json(filteredPos);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching purchase orders', error });
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { poNumber, vendorId, projectId, items } = req.body;
    
    const { getAccessibleProject } = require('../utils/projectAccess');
    const project = await getAccessibleProject(projectId, req.user!);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        projectId,
        status: 'ISSUED',
        items: {
            create: items.map((item: any) => ({
                materialId: item.materialId,
                quantity: item.quantity,
                rate: item.rate,
                total: item.quantity * item.rate
            }))
        }
      },
      include: { items: true }
    });

    return res.status(201).json(po);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating purchase order', error });
  }
};

export const createMaterialReceipt = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { receiptNumber, poId, projectId, items } = req.body;
      
      const { getAccessibleProject } = require('../utils/projectAccess');
      const project = await getAccessibleProject(projectId, req.user!);
      if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

      const receipt = await prisma.materialReceipt.create({
        data: {
          receiptNumber,
          poId,
          projectId,
          receivedById: req.user!.id,
          items: {
              create: items.map((item: any) => ({
                  materialId: item.materialId,
                  quantity: item.quantity
              }))
          }
        },
        include: { items: true }
      });

      // Update inventory logic
      for (const item of items) {
          const inv = await prisma.projectInventory.findFirst({
              where: { projectId, materialId: item.materialId }
          });
          if (inv) {
              await prisma.projectInventory.update({
                  where: { id: inv.id },
                  data: { receivedQuantity: { increment: item.quantity } }
              });
          } else {
              // Create inventory entry if it doesn't exist
              await prisma.projectInventory.create({
                  data: {
                      projectId,
                      materialId: item.materialId,
                      requiredQuantity: 0,
                      reorderLevel: 0,
                      receivedQuantity: item.quantity,
                      consumedQuantity: 0
                  }
              });
          }
      }
  
      return res.status(201).json(receipt);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating receipt', error });
    }
  };

export const consumeMaterial = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { projectId, siteId, materialId, quantity } = req.body;
      
      const { getAccessibleProject } = require('../utils/projectAccess');
      const project = await getAccessibleProject(projectId, req.user!);
      if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

      const consumption = await prisma.materialConsumption.create({
        data: {
          projectId,
          siteId,
          materialId,
          quantity,
          usedById: req.user!.id
        }
      });

      const inv = await prisma.projectInventory.findFirst({
        where: { projectId, materialId }
      });
      if (inv) {
        await prisma.projectInventory.update({
            where: { id: inv.id },
            data: { consumedQuantity: { increment: quantity } }
        });
      }
  
      return res.status(201).json(consumption);
    } catch (error) {
      return res.status(500).json({ message: 'Error consuming material', error });
    }
};
