"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ImportService = void 0;
const client_1 = require("@prisma/client");
const papaparse_1 = __importDefault(require("papaparse"));
const xlsx = __importStar(require("xlsx"));
const LocalStorageProvider_1 = require("../providers/LocalStorageProvider");
const prisma = new client_1.PrismaClient();
const storage = new LocalStorageProvider_1.LocalStorageProvider();
class ImportService {
    /**
     * Start processing a background import job
     */
    processJob(jobId_1) {
        return __awaiter(this, arguments, void 0, function* (jobId, strategy = 'SKIP') {
            const job = yield prisma.importJob.findUnique({ where: { id: jobId } });
            if (!job)
                throw new Error('Job not found');
            if (!job.sourcePath)
                throw new Error('Source file missing');
            try {
                yield prisma.importJob.update({
                    where: { id: jobId },
                    data: { status: 'VALIDATING', startedAt: new Date() }
                });
                const fileBuffer = yield storage.get(job.sourcePath);
                let data = [];
                if (job.fileType === 'text/csv' || job.filename.endsWith('.csv')) {
                    const fileContent = fileBuffer.toString('utf-8');
                    const parsed = papaparse_1.default.parse(fileContent, { header: true, skipEmptyLines: true });
                    data = parsed.data;
                }
                else {
                    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                    const sheetName = workbook.SheetNames[0];
                    data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
                }
                const totalRows = data.length;
                yield prisma.importJob.update({
                    where: { id: jobId },
                    data: { totalRows, status: 'IMPORTING' }
                });
                // Simple implementation: Just count the rows and mark them as skipped if no module mapping exists yet.
                // In a real application, module-specific logic (e.g. creating Projects, Vendors, etc.) goes here.
                // We will implement specific module handlers in subsequent steps.
                yield prisma.importJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        skippedRows: totalRows // Placeholder
                    }
                });
            }
            catch (error) {
                console.error(`Import failed for job ${jobId}:`, error);
                yield prisma.importJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        completedAt: new Date(),
                        errorReport: JSON.stringify([{ row: 0, message: error.message }])
                    }
                });
            }
        });
    }
}
exports.ImportService = ImportService;
