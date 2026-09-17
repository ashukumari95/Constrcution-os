import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async log(data: {
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    userId: string;
    organizationId: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          userId: data.userId,
          organizationId: data.organizationId,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // We don't throw here to prevent audit failure from crashing business logic
    }
  }
}
