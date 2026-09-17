import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { LocalStorageProvider } from '../providers/LocalStorageProvider';

const prisma = new PrismaClient();
const storage = new LocalStorageProvider();

export class ImportService {
  /**
   * Start processing a background import job
   */
  async processJob(jobId: string, strategy: 'CREATE' | 'SKIP' | 'UPDATE' = 'SKIP') {
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');
    if (!job.sourcePath) throw new Error('Source file missing');

    try {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'VALIDATING', startedAt: new Date() }
      });

      const fileBuffer = await storage.get(job.sourcePath);
      let data: any[] = [];

      if (job.fileType === 'text/csv' || job.filename.endsWith('.csv')) {
        const fileContent = fileBuffer.toString('utf-8');
        const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
        data = parsed.data;
      } else {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      const totalRows = data.length;
      await prisma.importJob.update({
        where: { id: jobId },
        data: { totalRows, status: 'IMPORTING' }
      });

      // Simple implementation: Just count the rows and mark them as skipped if no module mapping exists yet.
      // In a real application, module-specific logic (e.g. creating Projects, Vendors, etc.) goes here.
      // We will implement specific module handlers in subsequent steps.

      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          skippedRows: totalRows // Placeholder
        }
      });
    } catch (error: any) {
      console.error(`Import failed for job ${jobId}:`, error);
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorReport: JSON.stringify([{ row: 0, message: error.message }])
        }
      });
    }
  }
}
