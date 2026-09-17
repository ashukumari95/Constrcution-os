"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const contractorRoutes_1 = __importDefault(require("./routes/contractorRoutes"));
const labourRoutes_1 = __importDefault(require("./routes/labourRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const procurementRoutes_1 = __importDefault(require("./routes/procurementRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const dprRoutes_1 = __importDefault(require("./routes/dprRoutes"));
const issueRoutes_1 = __importDefault(require("./routes/issueRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const sitePhotoRoutes_1 = __importDefault(require("./routes/sitePhotoRoutes"));
const financeRoutes_1 = __importDefault(require("./routes/financeRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const riskRoutes_1 = __importDefault(require("./routes/riskRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const globalRoutes_1 = __importDefault(require("./routes/globalRoutes"));
const importRoutes_1 = __importDefault(require("./routes/importRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
const superAdminRoutes_1 = __importDefault(require("./routes/superAdminRoutes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express_1.default.json());
// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/projects/:projectId/finance', financeRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/contractors', contractorRoutes_1.default);
app.use('/api/labour', labourRoutes_1.default);
app.use('/api/materials', materialRoutes_1.default);
app.use('/api/vendors', vendorRoutes_1.default);
app.use('/api/procurement', procurementRoutes_1.default);
app.use('/api/dprs', dprRoutes_1.default);
app.use('/api/issues', issueRoutes_1.default);
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/photos', sitePhotoRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/risks', riskRoutes_1.default);
app.use('/api/projects/:projectId/risks', riskRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/global', globalRoutes_1.default);
app.use('/api/imports', importRoutes_1.default);
app.use('/api/organization', organizationRoutes_1.default);
app.use('/api/super-admin', superAdminRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
