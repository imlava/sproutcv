import { DocumentProcessingError, UnsupportedFileTypeError } from '@/types/analysis';

export class DocumentProcessor {
  private readonly supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  async extractText(file: File): Promise<string> {
    // Validate file
    this.validateFile(file);

    const fileType = this.getFileType(file);
    
    try {
      switch (fileType) {
        case 'pdf':
          return await this.extractFromPDF(file);
        case 'docx':
          return await this.extractFromDOCX(file);
        case 'txt':
          return await this.extractFromText(file);
        default:
          throw new UnsupportedFileTypeError(fileType);
      }
    } catch (error) {
      if (error instanceof UnsupportedFileTypeError) {
        throw error;
      }
      throw new DocumentProcessingError(`Failed to extract text from ${fileType}`, error);
    }
  }

  private validateFile(file: File): void {
    if (file.size > this.maxFileSize) {
      throw new DocumentProcessingError(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.supportedTypes.includes(file.type)) {
      throw new UnsupportedFileTypeError(file.type);
    }
  }

  private getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (file.type) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'text/plain':
        return 'txt';
      default:
        // Fallback to extension
        switch (extension) {
          case 'pdf':
            return 'pdf';
          case 'docx':
            return 'docx';
          case 'txt':
            return 'txt';
          default:
            throw new UnsupportedFileTypeError(file.type || extension || 'unknown');
        }
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    try {
      // For production, you'd use a proper PDF parsing library
      // This is a simplified implementation that would work for basic PDFs
      const text = await this.convertFileToText(file);
      return this.cleanText(text);
    } catch (error) {
      throw new DocumentProcessingError('PDF extraction failed', error);
    }
  }

  private async extractFromDOCX(file: File): Promise<string> {
    try {
      // For production, you'd use a proper DOCX parsing library
      // This is a simplified implementation
      const text = await this.convertFileToText(file);
      return this.cleanText(text);
    } catch (error) {
      throw new DocumentProcessingError('DOCX extraction failed', error);
    }
  }

  private async extractFromText(file: File): Promise<string> {
    try {
      const text = await file.text();
      return this.cleanText(text);
    } catch (error) {
      throw new DocumentProcessingError('Text extraction failed', error);
    }
  }

  private async convertFileToText(file: File): Promise<string> {
    // This is a simplified implementation
    // In production, you'd use proper libraries like pdf-parse, mammoth, etc.
    // or send the file to a backend service for processing
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          // For demo purposes, extract basic text
          // Real implementation would properly parse the binary format
          resolve(this.extractTextFromBinary(result));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  }

  private extractTextFromBinary(content: string): string {
    // This is a very basic text extraction for demo purposes
    // In production, use proper PDF/DOCX parsing libraries
    
    // Remove common binary patterns and extract readable text
    return content
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-@]/g, '') // Remove special characters but keep basic punctuation
      .trim();
  }

  // Utility method to get file metadata
  getFileMetadata(file: File): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  // Utility method to check if file is supported
  isFileSupported(file: File): boolean {
    return this.supportedTypes.includes(file.type) && file.size <= this.maxFileSize;
  }

  // Get supported file types for UI
  getSupportedTypes(): string[] {
    return ['pdf', 'docx', 'txt'];
  }

  // Get max file size for UI
  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}