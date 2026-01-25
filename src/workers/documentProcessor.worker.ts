/**
 * Web Worker for Heavy Document Processing
 * Handles OCR, PDF parsing, and complex format extraction off the main thread
 * Uses Comlink for seamless communication with main thread
 */

import { expose } from 'comlink';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Configure PDF.js worker - use local file to ensure version match
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface DocumentProcessorAPI {
  extractTextFromPDF(file: ArrayBuffer, options?: PDFExtractionOptions): Promise<ExtractionResult>;
  extractTextWithOCR(file: ArrayBuffer, language?: string): Promise<ExtractionResult>;
  extractTextFromDOCX(file: ArrayBuffer): Promise<ExtractionResult>;
  extractTextFromImage(file: ArrayBuffer, mimeType: string): Promise<ExtractionResult>;
  detectDocumentType(buffer: ArrayBuffer): Promise<DocumentTypeInfo>;
}

export interface PDFExtractionOptions {
  enableOCR?: boolean;
  ocrLanguage?: string;
  maxPages?: number;
}

export interface ExtractionResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    hasImages?: boolean;
    confidence?: number; // OCR confidence score 0-100
    processingTime: number;
    method: 'standard' | 'ocr' | 'hybrid';
  };
  warnings?: string[];
}

export interface DocumentTypeInfo {
  type: 'pdf' | 'docx' | 'image' | 'text' | 'unknown';
  mimeType: string;
  needsOCR: boolean;
  confidence: number;
}

class DocumentProcessor implements DocumentProcessorAPI {
  private ocrWorker: any = null;

  /**
   * Extract text from PDF with optional OCR fallback
   */
  async extractTextFromPDF(
    fileBuffer: ArrayBuffer,
    options: PDFExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const startTime = performance.now();
    const warnings: string[] = [];

    try {
      // First try standard text extraction
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const maxPages = options.maxPages || pdf.numPages;
      let fullText = '';
      let hasContent = false;
      let totalImages = 0;

      for (let i = 1; i <= Math.min(maxPages, pdf.numPages); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        if (pageText.length > 20) {
          hasContent = true;
        }

        fullText += pageText + '\n\n';

        // Check for images
        const ops = await page.getOperatorList();
        const imageOps = ops.fnArray.filter((fn: number) => 
          fn === pdfjsLib.OPS.paintImageXObject || 
          fn === pdfjsLib.OPS.paintJpegXObject
        );
        totalImages += imageOps.length;
      }

      // Clean up text
      fullText = this.cleanText(fullText);

      // If no meaningful content and OCR is enabled, try OCR
      if ((!hasContent || fullText.length < 100) && options.enableOCR) {
        warnings.push('Standard extraction yielded minimal text, attempting OCR...');
        
        try {
          const ocrResult = await this.extractTextWithOCR(
            fileBuffer,
            options.ocrLanguage || 'eng'
          );
          
          if (ocrResult.text.length > fullText.length * 1.5) {
            // OCR found significantly more text
            return {
              ...ocrResult,
              metadata: {
                ...ocrResult.metadata,
                pageCount: pdf.numPages,
                hasImages: totalImages > 0,
                method: 'hybrid',
                processingTime: performance.now() - startTime,
              },
              warnings: [...warnings, ...( ocrResult.warnings || [])],
            };
          }
        } catch (ocrError) {
          warnings.push(`OCR failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`);
        }
      }

      const processingTime = performance.now() - startTime;

      return {
        text: fullText,
        metadata: {
          pageCount: pdf.numPages,
          wordCount: this.countWords(fullText),
          characterCount: fullText.length,
          hasImages: totalImages > 0,
          processingTime,
          method: 'standard',
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text using OCR (for scanned PDFs or images)
   */
  async extractTextWithOCR(
    fileBuffer: ArrayBuffer,
    language: string = 'eng'
  ): Promise<ExtractionResult> {
    const startTime = performance.now();
    
    try {
      // Initialize Tesseract worker if not already created
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker(language, 1, {
          logger: (m: any) => {
            // Post progress updates back to main thread
            if (m.status === 'recognizing text') {
              self.postMessage({
                type: 'ocr-progress',
                progress: m.progress * 100,
              });
            }
          },
        });
      }

      // Convert ArrayBuffer to Blob for Tesseract
      const blob = new Blob([fileBuffer]);
      const { data } = await this.ocrWorker.recognize(blob);

      const cleanedText = this.cleanText(data.text);
      const processingTime = performance.now() - startTime;

      return {
        text: cleanedText,
        metadata: {
          wordCount: this.countWords(cleanedText),
          characterCount: cleanedText.length,
          confidence: data.confidence,
          processingTime,
          method: 'ocr',
        },
      };
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX files
   */
  async extractTextFromDOCX(fileBuffer: ArrayBuffer): Promise<ExtractionResult> {
    const startTime = performance.now();

    try {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
      const cleanedText = this.cleanText(result.value);
      const processingTime = performance.now() - startTime;

      const warnings: string[] = [];
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach((msg: any) => {
          if (msg.type === 'warning') {
            warnings.push(msg.message);
          }
        });
      }

      return {
        text: cleanedText,
        metadata: {
          wordCount: this.countWords(cleanedText),
          characterCount: cleanedText.length,
          processingTime,
          method: 'standard',
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from image files using OCR
   */
  async extractTextFromImage(
    fileBuffer: ArrayBuffer,
    mimeType: string
  ): Promise<ExtractionResult> {
    return this.extractTextWithOCR(fileBuffer, 'eng');
  }

  /**
   * Detect document type and whether it needs OCR
   */
  async detectDocumentType(buffer: ArrayBuffer): Promise<DocumentTypeInfo> {
    const bytes = new Uint8Array(buffer.slice(0, 12));

    // PDF signature
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      // Check if it's a scanned PDF by trying to extract text
      try {
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        
        return {
          type: 'pdf',
          mimeType: 'application/pdf',
          needsOCR: text.trim().length < 50, // Likely scanned if minimal text
          confidence: 1.0,
        };
      } catch {
        return {
          type: 'pdf',
          mimeType: 'application/pdf',
          needsOCR: true,
          confidence: 0.8,
        };
      }
    }

    // DOCX signature (PK zip format)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      return {
        type: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        needsOCR: false,
        confidence: 0.9,
      };
    }

    // PNG signature
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return {
        type: 'image',
        mimeType: 'image/png',
        needsOCR: true,
        confidence: 1.0,
      };
    }

    // JPEG signature
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return {
        type: 'image',
        mimeType: 'image/jpeg',
        needsOCR: true,
        confidence: 1.0,
      };
    }

    // Plain text (heuristic)
    const textChars = bytes.filter(b => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13);
    if (textChars.length / bytes.length > 0.8) {
      return {
        type: 'text',
        mimeType: 'text/plain',
        needsOCR: false,
        confidence: 0.7,
      };
    }

    return {
      type: 'unknown',
      mimeType: 'application/octet-stream',
      needsOCR: false,
      confidence: 0,
    };
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep punctuation
      .replace(/[^\w\s.,!?;:()\-'"@#$%&*+=\[\]{}/<>]/g, '')
      // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

// Export the processor instance for Comlink
const processor = new DocumentProcessor();

// Expose the processor API for Comlink
expose(processor);

export default processor;
