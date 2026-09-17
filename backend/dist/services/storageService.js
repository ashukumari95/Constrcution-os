"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.ALLOWED_MIMES = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const client_s3_1 = require("@aws-sdk/client-s3");
exports.ALLOWED_MIMES = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
class LocalStorageService {
    constructor() {
        this.uploadDir = path_1.default.join(__dirname, '../../uploads');
        this.baseUrl = 'http://localhost:5000/uploads'; // Configure via env later
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    uploadFile(file_1) {
        return __awaiter(this, arguments, void 0, function* (file, folder = 'misc') {
            // 1. Validate MIME Type
            if (!exports.ALLOWED_MIMES.includes(file.mimetype)) {
                throw new Error(`Invalid file type: ${file.mimetype}`);
            }
            // 2. Validate Size
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`File exceeds maximum allowed size of 10MB`);
            }
            // Prevent Path Traversal in folder name
            const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
            const folderPath = path_1.default.join(this.uploadDir, safeFolder);
            if (!fs_1.default.existsSync(folderPath)) {
                fs_1.default.mkdirSync(folderPath, { recursive: true });
            }
            // 3. Generate safe unique filename
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const safeExt = /^.[a-z0-9]+$/.test(ext) ? ext : '.bin';
            if (['.exe', '.sh', '.bat', '.js', '.php'].includes(safeExt)) {
                throw new Error('Executable files are not allowed');
            }
            const safeFileName = `${(0, uuid_1.v4)()}${safeExt}`;
            const targetPath = path_1.default.join(folderPath, safeFileName);
            fs_1.default.writeFileSync(targetPath, file.buffer);
            return {
                fileUrl: `${safeFolder}/${safeFileName}`,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            };
        });
    }
    getFileUrl(filePath) {
        return `${this.baseUrl}/${filePath}`;
    }
    deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullPath = path_1.default.join(this.uploadDir, filePath);
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
        });
    }
}
class S3StorageService {
    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || '';
        this.baseUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            }
        });
    }
    uploadFile(file_1) {
        return __awaiter(this, arguments, void 0, function* (file, folder = 'misc') {
            if (!exports.ALLOWED_MIMES.includes(file.mimetype)) {
                throw new Error(`Invalid file type: ${file.mimetype}`);
            }
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`File exceeds maximum allowed size of 10MB`);
            }
            const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const safeExt = /^.[a-z0-9]+$/.test(ext) ? ext : '.bin';
            if (['.exe', '.sh', '.bat', '.js', '.php'].includes(safeExt)) {
                throw new Error('Executable files are not allowed');
            }
            const safeFileName = `${(0, uuid_1.v4)()}${safeExt}`;
            const key = `${safeFolder}/${safeFileName}`;
            yield this.s3Client.send(new client_s3_1.PutObjectCommand({
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
        });
    }
    getFileUrl(filePath) {
        return `${this.baseUrl}/${filePath}`;
    }
    deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: filePath
            }));
        });
    }
}
exports.storageService = process.env.STORAGE_PROVIDER === 's3'
    ? new S3StorageService()
    : new LocalStorageService();
