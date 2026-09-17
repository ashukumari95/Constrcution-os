const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix req.user to req.user!
  content = content.replace(/req\.user\.organizationId/g, 'req.user!.organizationId');
  content = content.replace(/req\.user\.id/g, 'req.user!.id');
  
  // Fix req.params
  content = content.replace(/projectId: projectId/g, 'projectId: projectId as string');
  content = content.replace(/req\.params\.projectId/g, '(req.params.projectId as string)');
  content = content.replace(/req\.params\.id/g, '(req.params.id as string)');
  content = content.replace(/id: req\.params\.id/g, 'id: req.params.id as string');
  
  // ProjectController specific fixes
  content = content.replace(/role: 'ADMIN'/g, '');
  content = content.replace(/userId: req\.user!\.id,\s*}/g, 'userId: req.user!.id }');
  
  fs.writeFileSync(filePath, content);
}

// Fix routes
const routesDir = path.join(__dirname, 'src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of routeFiles) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import \{ authMiddleware \}/g, 'import { authenticateToken }');
  content = content.replace(/router\.use\(authMiddleware\)/g, 'router.use(authenticateToken)');
  fs.writeFileSync(filePath, content);
}

console.log('Fixed TypeScript errors');
