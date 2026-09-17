const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure req.params properties are extracted as strings
  content = content.replace(/const \{ id \} = req\.params;/g, 'const id = req.params.id as string;');
  content = content.replace(/const \{ projectId \} = req\.params;/g, 'const projectId = req.params.projectId as string;');
  content = content.replace(/const \{ taskId \} = req\.params;/g, 'const taskId = req.params.taskId as string;');
  
  // Fix remaining undefined req.user if any
  content = content.replace(/req\.user\./g, 'req.user!.');
  // Revert req.user!.! to req.user!
  content = content.replace(/req\.user!\.!/g, 'req.user!');
  
  fs.writeFileSync(filePath, content);
}

console.log('Fixed more TypeScript errors');
