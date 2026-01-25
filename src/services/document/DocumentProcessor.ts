/**
 * Document Processor - Unified interface for text extraction
 * Delegates to DocumentProcessingService which uses Web Workers for heavy processing
 */
import { documentProcessor, DocumentProcessingService } from '../DocumentProcessingService';
import { DocumentProcessingError, UnsupportedFileTypeError } from '@/types/analysis';

export interface ExtractionOptions {
  enableOCR?: boolean;
  ocrLanguage?: string;
  onProgress?: (progress: number, stage: string) => void;
}

export interface ExtractionMetadata {
  pageCount?: number;
  wordCount: number;
  characterCount: number;
  hasImages?: boolean;
  confidence?: number;
  processingTime: number;
  method: 'standard' | 'ocr' | 'hybrid';
}

export interface ExtractionResult {
  text: string;
  metadata: ExtractionMetadata;
  warnings?: string[];
}

/**
 * Supported file types configuration
 */
export const SUPPORTED_FILE_TYPES = {
  // Documents
  'application/pdf': { type: 'pdf', name: 'PDF Document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'docx', name: 'Word Document (DOCX)' },
  'application/msword': { type: 'doc', name: 'Word Document (DOC)' },
  'text/plain': { type: 'txt', name: 'Plain Text' },
  'text/markdown': { type: 'md', name: 'Markdown' },
  'application/rtf': { type: 'rtf', name: 'Rich Text Format' },
  'text/rtf': { type: 'rtf', name: 'Rich Text Format' },
  'text/html': { type: 'html', name: 'HTML Document' },
  'text/csv': { type: 'csv', name: 'CSV File' },
  
  // Images (for OCR)
  'image/png': { type: 'image', name: 'PNG Image' },
  'image/jpeg': { type: 'image', name: 'JPEG Image' },
  'image/jpg': { type: 'image', name: 'JPEG Image' },
  'image/gif': { type: 'image', name: 'GIF Image' },
  'image/bmp': { type: 'image', name: 'BMP Image' },
  'image/tiff': { type: 'image', name: 'TIFF Image' },
  'image/webp': { type: 'image', name: 'WebP Image' },
} as const;

export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.rtf',
  '.html', '.htm', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif', '.webp'
];

// Maximum file size: 15MB
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Minimum content length for valid resume
export const MIN_CONTENT_LENGTH = 50;

/**
 * DocumentProcessor class - Production-ready document processing
 * Uses Web Workers for non-blocking PDF/DOCX/OCR processing
 */
export class DocumentProcessor {
  private documentService: DocumentProcessingService;

  constructor() {
    this.documentService = documentProcessor;
  }

  /**
   * Extract text from any supported file type
   */
  async extractText(file: File, options: ExtractionOptions = {}): Promise<string> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new DocumentProcessingError(validation.error || 'File validation failed');
    }

    try {
      // Use the main DocumentProcessingService with web worker
      const result = await this.documentService.extractText(file, {
        enableOCR: options.enableOCR,
        ocrLanguage: options.ocrLanguage,
        onProgress: options.onProgress,
      });

      // Validate extraction result
      if (!result.text || result.text.trim().length < MIN_CONTENT_LENGTH) {
        // Try OCR if standard extraction failed and file might have images
        if (!options.enableOCR && this.mightNeedOCR(file, result.text)) {
          console.log('Standard extraction yielded minimal text, attempting OCR...');
          const ocrResult = await this.documentService.extractText(file, {
            enableOCR: true,
            ocrLanguage: options.ocrLanguage || 'eng',
            onProgress: options.onProgress,
          });
          
          if (ocrResult.text && ocrResult.text.trim().length > MIN_CONTENT_LENGTH) {
            return this.cleanText(ocrResult.text);
          }
        }

        throw new DocumentProcessingError(
          'Unable to extract sufficient text from this file. The document may contain only images or be in an unsupported format. Please try copying and pasting your resume text manually.'
        );
      }

      return this.cleanText(result.text);
    } catch (error) {
      if (error instanceof DocumentProcessingError) {
        throw error;
      }
      
      console.error('Document extraction error:', error);
      throw new DocumentProcessingError(
        `Failed to extract text from ${this.getFileTypeName(file)}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Extract text with full metadata
   */
  async extractTextWithMetadata(file: File, options: ExtractionOptions = {}): Promise<ExtractionResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new DocumentProcessingError(validation.error || 'File validation failed');
    }

    try {
      const result = await this.documentService.extractText(file, options);
      
      return {
        text: this.cleanText(result.text),
        metadata: {
          wordCount: result.metadata.wordCount,
          characterCount: result.metadata.characterCount,
          pageCount: result.metadata.pageCount,
          hasImages: result.metadata.hasImages,
          confidence: result.metadata.confidence,
          processingTime: result.metadata.processingTime,
          method: result.metadata.method,
        },
        warnings: result.warnings,
      };
    } catch (error) {
      console.error('Extraction with metadata failed:', error);
      throw new DocumentProcessingError(
        `Failed to process ${this.getFileTypeName(file)}`,
        error
      );
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check if file exists and has content
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return { 
        valid: false, 
        error: `File size (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB)` 
      };
    }

    // Check file type by MIME type
    const isKnownMime = file.type && file.type in SUPPORTED_FILE_TYPES;
    
    // Check file type by extension
    const extension = this.getFileExtension(file.name);
    const isKnownExtension = SUPPORTED_EXTENSIONS.includes(extension);

    if (!isKnownMime && !isKnownExtension) {
      return {
        valid: false,
        error: `Unsupported file type "${file.type || extension}". Supported formats: PDF, DOCX, TXT, and images (PNG, JPG).`
      };
    }

    return { valid: true };
  }

  /**
   * Check if file might need OCR
   */
  private mightNeedOCR(file: File, extractedText: string): boolean {
    const extension = this.getFileExtension(file.name);
    const isImage = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff'].includes(file.type) ||
                   ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif'].includes(extension);
    
    if (isImage) return true;
    
    // PDF might be scanned
    if (file.type === 'application/pdf' || extension === '.pdf') {
      // If we got very little text, it might be a scanned PDF
      return !extractedText || extractedText.trim().length < MIN_CONTENT_LENGTH;
    }

    return false;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return '.' + parts.pop()!.toLowerCase();
  }

  /**
   * Get human-readable file type name
   */
  private getFileTypeName(file: File): string {
    if (file.type && file.type in SUPPORTED_FILE_TYPES) {
      return SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES].name;
    }
    
    const extension = this.getFileExtension(file.name);
    const extensionMap: Record<string, string> = {
      '.pdf': 'PDF Document',
      '.docx': 'Word Document',
      '.doc': 'Word Document',
      '.txt': 'Text File',
      '.png': 'PNG Image',
      '.jpg': 'JPEG Image',
      '.jpeg': 'JPEG Image',
    };
    
    return extensionMap[extension] || 'document';
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive newlines but keep paragraph breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Clean up common OCR/extraction artifacts
      .replace(/\s+([,.;:!?])/g, '$1')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Trim
      .trim();
  }

  /**
   * Get file metadata without extracting text
   */
  getFileMetadata(file: File): {
    name: string;
    size: number;
    type: string;
    extension: string;
    lastModified: number;
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      extension: this.getFileExtension(file.name),
      lastModified: file.lastModified,
    };
  }

  /**
   * Check if file type is supported
   */
  isFileSupported(file: File): boolean {
    return this.validateFile(file).valid;
  }

  /**
   * Get list of supported file types for UI
   */
  getSupportedTypes(): string[] {
    return ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
  }

  /**
   * Get supported file extensions for file input
   */
  getSupportedExtensions(): string[] {
    return SUPPORTED_EXTENSIONS;
  }

  /**
   * Get max file size
   */
  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  /**
   * Get accept string for file input
   */
  getAcceptString(): string {
    return SUPPORTED_EXTENSIONS.join(',');
  }
}

// Export singleton instance
export const documentProcessorInstance = new DocumentProcessor();
export default DocumentProcessor;

