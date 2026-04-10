import {
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, promises as fs } from 'node:fs';
import { extname, resolve } from 'node:path';

export interface UploadedApplicationFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface SavedApplicationFile {
  attachmentOriginalName: string | null;
  attachmentStoredName: string | null;
  attachmentMimeType: string | null;
  attachmentPath: string | null;
}

@Injectable()
export class ApplicationUploadService {
  private readonly uploadDir = resolve(
    process.cwd(),
    process.env.APPLICATION_UPLOAD_DIR ?? 'data/uploads/applications',
  );

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file?: UploadedApplicationFile): Promise<SavedApplicationFile> {
    if (!file) {
      return {
        attachmentOriginalName: null,
        attachmentStoredName: null,
        attachmentMimeType: null,
        attachmentPath: null,
      };
    }

    this.assertMimeType(file.mimetype);

    const normalizedOriginalName = this.normalizeFileName(file.originalname);

    const extension =
      extname(normalizedOriginalName) ||
      this.getDefaultExtension(file.mimetype);

    const storedName = `${randomUUID()}${extension}`;
    const absolutePath = resolve(this.uploadDir, storedName);

    await fs.writeFile(absolutePath, file.buffer);

    return {
      attachmentOriginalName: normalizedOriginalName,
      attachmentStoredName: storedName,
      attachmentMimeType: file.mimetype,
      attachmentPath: absolutePath,
    };
  }

  private normalizeFileName(fileName: string) {
    try {
      const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
      return decoded.replace(/[\/\\?%*:|"<>]/g, '_').trim();
    } catch {
      return fileName.replace(/[\/\\?%*:|"<>]/g, '_').trim();
    }
  }

  async read(attachmentPath: string | null) {
    if (!attachmentPath) {
      throw new NotFoundException('Application attachment was not found');
    }

    return fs.readFile(attachmentPath);
  }

  private assertMimeType(mimeType: string) {
    const allowedTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);

    if (!allowedTypes.has(mimeType)) {
      throw new UnsupportedMediaTypeException(
        'Only PDF or Word documents are allowed',
      );
    }
  }

  private getDefaultExtension(mimeType: string) {
    if (mimeType === 'application/pdf') {
      return '.pdf';
    }

    if (mimeType === 'application/msword') {
      return '.doc';
    }

    return '.docx';
  }
}
