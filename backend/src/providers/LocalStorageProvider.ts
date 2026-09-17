import { IStorageProvider } from './StorageProvider';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads');
    // Ensure base directory exists on instantiation
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  async upload(file: Express.Multer.File, directory: string): Promise<string> {
    const targetDir = path.join(this.baseDir, directory);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const uniqueName = crypto.randomUUID() + ext;
    const destPath = path.join(targetDir, uniqueName);

    await fs.writeFile(destPath, file.buffer);
    
    // Return relative path from baseDir to store in DB
    return path.posix.join(directory, uniqueName);
  }

  async get(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, relativePath);
    return await fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async getAccessUrl(relativePath: string): Promise<string> {
    // In local development, we expose the /uploads directory via express.static
    return `/uploads/${relativePath}`;
  }
}
