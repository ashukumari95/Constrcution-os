import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

export const generateReport = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { type } = req.params;
    const { projectId, month, year } = req.query; // basic filters

    const orgId = req.user!.organizationId;
    let projectWhere: any = { organizationId: orgId };
    
    // If projectId is provided, verify they have access to it
    if (projectId) {
      if (req.user!.role === 'CLIENT' || req.user!.permissions.includes('client.dashboard.view')) {
        projectWhere = { id: projectId as string, organizationId: orgId, members: { some: { userId: req.user!.id } } };
      } else {
        projectWhere = { id: projectId as string, organizationId: orgId };
      }
    } else {
      if (req.user!.role === 'CLIENT' || req.user!.permissions.includes('client.dashboard.view')) {
        return res.status(403).json({ message: 'Clients must specify a project for reports.' });
      }
    }

    let reportData: any = { type, generatedAt: new Date(), generatedBy: req.user!.email };

    switch (type) {
      case 'project-summary':
        const projects = await prisma.project.findMany({
          where: projectWhere,
          include: {
            tasks: true,
            issues: { where: { status: 'OPEN' } }
          }
        });
        reportData.projects = projects.map(p => {
          const completedTasks = p.tasks.filter(t => t.status === 'COMPLETED').length;
          return {
            id: p.id,
            name: p.name,
            status: p.status,
            contractValue: p.contractValue,
            progress: p.tasks.length ? Math.round((completedTasks / p.tasks.length) * 100) : 0,
            openIssues: p.issues.length
          };
        });
        break;

      case 'monthly-progress':
        // simplified logic for specific month
        if (!projectId) return res.status(400).json({ message: 'projectId required for monthly progress report' });
        
        // Verify project ownership
        const dprProj = await prisma.project.findFirst({ where: projectWhere });
        if (!dprProj) return res.status(403).json({ message: 'Unauthorized access to project' });

        const dprs = await prisma.dailyProgressReport.findMany({
          where: { projectId: projectId as string, status: 'APPROVED' },
          orderBy: { date: 'asc' }
        });
        reportData.dprs = dprs;
        break;

      case 'cost-budget':
        if (req.user!.role === 'CLIENT' || req.user!.permissions.includes('client.dashboard.view')) {
          return res.status(403).json({ message: 'Unauthorized to view cost data.' });
        }
        const costProjects = await prisma.project.findMany({
          where: projectWhere,
          include: { invoices: true, expenses: true, purchaseOrders: { include: { items: true } } }
        });
        reportData.financials = costProjects.map(p => {
          const invoiced = p.invoices.reduce((acc, i) => acc + i.total, 0);
          const expensed = p.expenses.reduce((acc, e) => acc + e.amount, 0);
          const committed = p.purchaseOrders.reduce((sum, po) => {
            return sum + po.items.reduce((s, item) => s + item.total, 0);
          }, 0);
          return {
            id: p.id,
            name: p.name,
            budget: p.budget,
            actualCost: invoiced + expensed,
            committedCost: committed,
            variance: (p.budget || 0) - (invoiced + expensed)
          };
        });
        break;

      case 'boq':
        if (!projectId) return res.status(400).json({ message: 'projectId required for BOQ report' });
        
        // Verify project ownership
        const boqProj = await prisma.project.findFirst({ where: projectWhere });
        if (!boqProj) return res.status(403).json({ message: 'Unauthorized access to project' });

        const boqItems = await prisma.boqItem.findMany({ where: { projectId: projectId as string } });
        reportData.boq = boqItems;
        break;

      case 'procurement':
        if (req.user!.role === 'CLIENT') return res.status(403).json({ message: 'Unauthorized to view procurement data.' });
        const purchaseOrders = await prisma.purchaseOrder.findMany({
          where: { project: projectWhere },
          include: { vendor: true, items: true }
        });
        reportData.purchaseOrders = purchaseOrders;
        break;

      case 'risk':
        const risks = await prisma.projectRisk.findMany({
          where: { project: projectWhere },
          include: { project: { select: { name: true } } },
          orderBy: { riskScore: 'desc' }
        });
        reportData.risks = risks;
        break;

      case 'labour':
        if (!projectId) return res.status(400).json({ message: 'projectId required for labour report' });
        const labourLogs = await prisma.labourAttendance.findMany({
          where: { projectId: projectId as string },
          include: { worker: { select: { firstName: true, lastName: true } } },
          orderBy: { date: 'desc' }
        });
        reportData.labour = labourLogs;
        break;

      case 'dpr':
        if (!projectId) return res.status(400).json({ message: 'projectId required for DPR report' });
        const projectDprs = await prisma.dailyProgressReport.findMany({
          where: { projectId: projectId as string },
          orderBy: { date: 'desc' }
        });
        reportData.dprs = projectDprs;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    return res.json(reportData);
  } catch (error) {
    return res.status(500).json({ message: 'Error generating report', error });
  }
};
