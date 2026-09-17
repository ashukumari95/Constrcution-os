import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface StorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<{ fileUrl: string, fileName: string, fileSize: number, mimeType: string }>;
  getFileUrl(filePath: string): string;
  deleteFile(filePath: string): Promise<void>;
}

export const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class LocalStorageService implements StorageService {
  private readonly uploadDir = path.join(__dirname, '../../uploads');
  private readonly baseUrl = 'http://localhost:5000/uploads'; // Configure via env later

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'misc'): Promise<{ fileUrl: string, fileName: string, fileSize: number, mimeType: string }> {
    // 1. Validate MIME Type
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    // 2. Validate Size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum allowed size of 10MB`);
    }

    // Prevent Path Traversal in folder name
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const folderPath = path.join(this.uploadDir, safeFolder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // 3. Generate safe unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = /^.[a-z0-9]+$/.test(ext) ? ext : '.bin';
    
    if (['.exe', '.sh', '.bat', '.js', '.php'].includes(safeExt)) {
       throw new Error('Executable files are not allowed');
    }

    const safeFileName = `${uuidv4()}${safeExt}`;
    const targetPath = path.join(folderPath, safeFileName);
    
    fs.writeFileSync(targetPath, file.buffer);

    return {
      fileUrl: `${safeFolder}/${safeFileName}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  }

  getFileUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private baseUrl: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    this.baseUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      }
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'misc'): Promise<{ fileUrl: string, fileName: string, fileSize: number, mimeType: string }> {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum allowed size of 10MB`);
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = /^.[a-z0-9]+$/.test(ext) ? ext : '.bin';
    if (['.exe', '.sh', '.bat', '.js', '.php'].includes(safeExt)) {
       throw new Error('Executable files are not allowed');
    }

    const safeFileName = `${uuidv4()}${safeExt}`;
    const key = `${safeFolder}/${safeFileName}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    return {
      fileUrl: key,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  }

  getFileUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath
    }));
  }
}

export const storageService: StorageService = process.env.STORAGE_PROVIDER === 's3' 
  ? new S3StorageService() 
  : new LocalStorageService();
