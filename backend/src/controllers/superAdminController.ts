import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logAudit } from '../utils/auditLogger';

export const listOrganizations = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true, projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute dynamic TRIAL_EXPIRED status
    const mapped = organizations.map(org => {
      let computedSubscriptionStatus = org.subscriptionStatus || 'ACTIVE';
      if (
        computedSubscriptionStatus === 'TRIAL' && 
        org.trialEndsAt && 
        new Date() > org.trialEndsAt
      ) {
        computedSubscriptionStatus = 'TRIAL_EXPIRED';
      }

      return {
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        createdAt: org.createdAt,
        status: org.status,
        plan: org.plan,
        subscriptionStatus: computedSubscriptionStatus,
        trialStartedAt: org.trialStartedAt,
        trialEndsAt: org.trialEndsAt,
        userCount: org._count.users,
        projectCount: org._count.projects,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const extendTrial = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { additionalDays } = req.body;

    if (!additionalDays || additionalDays <= 0) {
      return res.status(400).json({ message: 'Valid additionalDays is required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Use current trialEndsAt or now if null
    const baseDate = org.trialEndsAt ? new Date(org.trialEndsAt) : new Date();
    const newTrialEndsAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        trialEndsAt: newTrialEndsAt,
        subscriptionStatus: 'TRIAL'
      }
    });

    await logAudit(
      'EXTEND_TRIAL',
      'Organization',
      id,
      req.user!.id,
      req.user!.organizationId, // SUPER_ADMIN's organization
      { previousEndsAt: org.trialEndsAt, newEndsAt: newTrialEndsAt, addedDays: additionalDays }
    );

    let computedSubscriptionStatus = updatedOrg.subscriptionStatus;
    if (computedSubscriptionStatus === 'TRIAL' && updatedOrg.trialEndsAt && new Date() > updatedOrg.trialEndsAt) {
      computedSubscriptionStatus = 'TRIAL_EXPIRED';
    }

    res.json({
      message: 'Trial extended successfully',
      organization: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        trialEndsAt: updatedOrg.trialEndsAt,
        subscriptionStatus: computedSubscriptionStatus
      }
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { plan, subscriptionStatus, userLimit, projectLimit, storageLimit } = req.body;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        plan,
        subscriptionStatus,
        userLimit,
        projectLimit,
        storageLimit
      }
    });

    await logAudit(
      'UPDATE_PLAN',
      'Organization',
      id,
      req.user!.id,
      req.user!.organizationId,
      { plan, subscriptionStatus, userLimit, projectLimit, storageLimit }
    );

    res.json({ message: 'Plan updated successfully', organization: org });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
