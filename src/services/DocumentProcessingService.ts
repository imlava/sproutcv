/**
 * Document Processing Service
 * Main interface for document text extraction using Web Worker
 */

import { wrap, Remote } from 'comlink';
import type { 
  DocumentProcessorAPI, 
  ExtractionResult, 
  DocumentTypeInfo,
  PDFExtractionOptions 
} from '../workers/documentProcessor.worker';

// Create worker instance
const createDocumentWorker = (): Remote<DocumentProcessorAPI> => {
  const worker = new Worker(
    new URL('../workers/documentProcessor.worker.ts', import.meta.url),
    { type: 'module' }
  );
  return wrap<DocumentProcessorAPI>(worker);
};

// Singleton worker instance
let workerInstance: Remote<DocumentProcessorAPI> | null = null;

const getWorker = (): Remote<DocumentProcessorAPI> => {
  if (!workerInstance) {
    workerInstance = createDocumentWorker();
  }
  return workerInstance;
};

/**
 * Enhanced Document Processing Service
 * Handles all document formats with automatic format detection and OCR
 */
export class DocumentProcessingService {
  private worker: Remote<DocumentProcessorAPI>;

  constructor() {
    this.worker = getWorker();
  }

  /**
   * Auto-detect format and extract text from any supported document
   */
  async extractText(
    file: File,
    options: {
      enableOCR?: boolean;
      ocrLanguage?: string;
      onProgress?: (progress: number, stage: string) => void;
    } = {}
  ): Promise<ExtractionResult> {
    const fileBuffer = await file.arrayBuffer();
    
    // Detect document type
    const typeInfo = await this.worker.detectDocumentType(fileBuffer);

    // Route to appropriate extraction method
    switch (typeInfo.type) {
      case 'pdf':
        return this.extractFromPDF(fileBuffer, {
          enableOCR: options.enableOCR || typeInfo.needsOCR,
          ocrLanguage: options.ocrLanguage,
        });

      case 'docx':
        return this.worker.extractTextFromDOCX(fileBuffer);

      case 'image':
        if (options.onProgress) {
          options.onProgress(0, 'Starting OCR...');
        }
        return this.worker.extractTextFromImage(fileBuffer, typeInfo.mimeType);

      case 'text':
        return this.extractFromPlainText(file);

      default:
        throw new Error(`Unsupported file type: ${typeInfo.mimeType}`);
    }
  }

  /**
   * Extract from PDF with intelligent OCR fallback
   */
  async extractFromPDF(
    buffer: ArrayBuffer,
    options: PDFExtractionOptions = {}
  ): Promise<ExtractionResult> {
    return this.worker.extractTextFromPDF(buffer, options);
  }

  /**
   * Extract from plain text file
   */
  private async extractFromPlainText(file: File): Promise<ExtractionResult> {
    const startTime = performance.now();
    const text = await file.text();
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        characterCount: text.length,
        processingTime: performance.now() - startTime,
        method: 'standard',
      },
    };
  }

  /**
   * Detect document type
   */
  async detectType(file: File): Promise<DocumentTypeInfo> {
    const buffer = await file.arrayBuffer();
    return this.worker.detectDocumentType(buffer);
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB increased from 10MB

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (15MB)`,
      };
    }

    const supportedExtensions = [
      '.pdf', '.docx', '.txt', '.md', '.markdown',
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff',
      '.rtf', '.html', '.htm', '.csv'
    ];

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported file type. Supported formats: ${supportedExtensions.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessingService();
