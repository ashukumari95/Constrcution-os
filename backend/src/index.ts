import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import contractorRoutes from './routes/contractorRoutes';
import labourRoutes from './routes/labourRoutes';
import materialRoutes from './routes/materialRoutes';
import procurementRoutes from './routes/procurementRoutes';
import vendorRoutes from './routes/vendorRoutes';
import dprRoutes from './routes/dprRoutes';
import issueRoutes from './routes/issueRoutes';
import documentRoutes from './routes/documentRoutes';
import sitePhotoRoutes from './routes/sitePhotoRoutes';
import financeRoutes from './routes/financeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import riskRoutes from './routes/riskRoutes';
import reportRoutes from './routes/reportRoutes';
import globalRoutes from './routes/globalRoutes';
import importRoutes from './routes/importRoutes';
import organizationRoutes from './routes/organizationRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import { PrismaClient } from '@prisma/client';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/finance', financeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/dprs', dprRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/photos', sitePhotoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/projects/:projectId/risks', riskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/global', globalRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/super-admin', superAdminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
