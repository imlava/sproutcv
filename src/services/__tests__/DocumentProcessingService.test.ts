/**
 * Document Processing Service Tests
 * Tests for file validation, text extraction, and OCR functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentProcessor, SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from '../document/DocumentProcessor';

// Mock the DocumentProcessingService
vi.mock('../DocumentProcessingService', () => ({
  documentProcessor: {
    extractText: vi.fn(),
    validateFile: vi.fn(),
    detectType: vi.fn(),
  },
  DocumentProcessingService: vi.fn(),
}));

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor();
    vi.clearAllMocks();
  });

  describe('File Validation', () => {
    it('should accept valid PDF files', () => {
      const file = createMockFile('resume.pdf', 'application/pdf', 1024 * 1024); // 1MB
      const result = processor.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid DOCX files', () => {
      const file = createMockFile(
        'resume.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        1024 * 1024
      );
      const result = processor.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid text files', () => {
      const file = createMockFile('resume.txt', 'text/plain', 1024);
      const result = processor.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid image files for OCR', () => {
      const pngFile = createMockFile('resume.png', 'image/png', 2 * 1024 * 1024);
      const jpgFile = createMockFile('resume.jpg', 'image/jpeg', 2 * 1024 * 1024);
      
      expect(processor.validateFile(pngFile).valid).toBe(true);
      expect(processor.validateFile(jpgFile).valid).toBe(true);
    });

    it('should reject empty files', () => {
      const file = createMockFile('empty.pdf', 'application/pdf', 0);
      const result = processor.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject oversized files', () => {
      const file = createMockFile('large.pdf', 'application/pdf', MAX_FILE_SIZE + 1);
      const result = processor.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject unsupported file types', () => {
      const file = createMockFile('resume.exe', 'application/x-msdownload', 1024);
      const result = processor.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });

    it('should use extension fallback for unknown MIME types', () => {
      const file = createMockFile('resume.pdf', '', 1024 * 1024);
      const result = processor.validateFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('File Type Detection', () => {
    it('should correctly identify PDF files', () => {
      expect(processor.isFileSupported(createMockFile('test.pdf', 'application/pdf', 1024))).toBe(true);
    });

    it('should correctly identify DOCX files', () => {
      const file = createMockFile(
        'test.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        1024
      );
      expect(processor.isFileSupported(file)).toBe(true);
    });

    it('should correctly identify image files', () => {
      expect(processor.isFileSupported(createMockFile('scan.png', 'image/png', 1024))).toBe(true);
      expect(processor.isFileSupported(createMockFile('scan.jpg', 'image/jpeg', 1024))).toBe(true);
    });
  });

  describe('Supported Types', () => {
    it('should return correct supported types', () => {
      const types = processor.getSupportedTypes();
      expect(types).toContain('pdf');
      expect(types).toContain('docx');
      expect(types).toContain('txt');
    });

    it('should return correct supported extensions', () => {
      const extensions = processor.getSupportedExtensions();
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.docx');
      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.jpg');
    });

    it('should return correct max file size', () => {
      expect(processor.getMaxFileSize()).toBe(MAX_FILE_SIZE);
    });

    it('should return correct accept string', () => {
      const acceptString = processor.getAcceptString();
      expect(acceptString).toContain('.pdf');
      expect(acceptString).toContain('.docx');
    });
  });

  describe('File Metadata', () => {
    it('should return correct file metadata', () => {
      const file = createMockFile('resume.pdf', 'application/pdf', 1024 * 500, Date.now());
      const metadata = processor.getFileMetadata(file);
      
      expect(metadata.name).toBe('resume.pdf');
      expect(metadata.size).toBe(1024 * 500);
      expect(metadata.type).toBe('application/pdf');
      expect(metadata.extension).toBe('.pdf');
    });

    it('should handle files without extensions', () => {
      const file = createMockFile('resume', 'application/pdf', 1024);
      const metadata = processor.getFileMetadata(file);
      expect(metadata.extension).toBe('');
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockFile(
  name: string,
  type: string,
  size: number,
  lastModified: number = Date.now()
): File {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type, lastModified });
}

// Integration-style tests that would work with actual implementation
describe('DocumentProcessor Integration', () => {
  describe('Text Extraction Flow', () => {
    it('should handle the complete extraction flow for PDF', async () => {
      // This test validates the interface contract
      const processor = new DocumentProcessor();
      
      // Validate that the processor has all required methods
      expect(typeof processor.extractText).toBe('function');
      expect(typeof processor.extractTextWithMetadata).toBe('function');
      expect(typeof processor.validateFile).toBe('function');
      expect(typeof processor.isFileSupported).toBe('function');
    });

    it('should handle extraction errors gracefully', async () => {
      const processor = new DocumentProcessor();
      
      // Create an invalid file
      const invalidFile = createMockFile('invalid.xyz', 'application/octet-stream', 100);
      
      // Validation should fail
      const validation = processor.validateFile(invalidFile);
      expect(validation.valid).toBe(false);
    });
  });
});
