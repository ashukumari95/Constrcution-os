import prisma from './prisma';

export const logAudit = async (
  action: string,
  entity: string,
  entityId: string | null,
  userId: string | null,
  organizationId: string,
  metadata?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        organizationId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Do not throw, as we don't want audit log failures to break main business logic
  }
};
