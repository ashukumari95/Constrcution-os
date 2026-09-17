import prisma from './prisma';

export const getAccessibleProject = async (projectId: string, user: any): Promise<any | null> => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isClient = user.role === 'CLIENT' || user.permissions.includes('client.dashboard.view');

  let whereClause: any = { id: projectId };
  
  if (!isSuperAdmin) {
    whereClause.organizationId = user.organizationId;
  }

  if (isClient) {
    whereClause.members = {
      some: { userId: user.id }
    };
  }

  return await prisma.project.findFirst({ where: whereClause });
};
