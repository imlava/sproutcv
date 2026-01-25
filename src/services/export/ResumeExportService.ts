/**
 * Resume Export Service
 * Handles PDF, DOCX, and other export formats for tailored resumes
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeSection {
  id: string;
  name: string;
  content: string;
}

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  sections: ResumeSection[];
  jobTitle?: string;
  companyName?: string;
}

export interface ExportOptions {
  template?: 'professional' | 'modern' | 'classic' | 'minimal' | 'executive';
  fontSize?: 'small' | 'medium' | 'large';
  margins?: 'narrow' | 'normal' | 'wide';
  includeDate?: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    text: string;
  };
}

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'json';

// ============================================================================
// TEMPLATE STYLES
// ============================================================================

const TEMPLATE_STYLES: Record<string, string> = {
  professional: `
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; }
    h1 { font-size: 28px; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 14px; color: #4a5568; margin-top: 0; font-weight: normal; }
    h3 { font-size: 16px; color: #1a365d; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .contact { font-size: 12px; color: #4a5568; margin-bottom: 20px; }
    .contact span { margin-right: 15px; }
    .section-content { font-size: 11px; line-height: 1.6; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
  `,
  modern: `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2d3748; }
    h1 { font-size: 32px; color: #5a67d8; margin-bottom: 4px; font-weight: 600; }
    h2 { font-size: 14px; color: #718096; margin-top: 0; font-weight: 400; }
    h3 { font-size: 14px; color: #5a67d8; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
    .contact { font-size: 11px; color: #718096; margin-bottom: 24px; display: flex; gap: 20px; flex-wrap: wrap; }
    .section-content { font-size: 11px; line-height: 1.7; }
    ul { margin: 8px 0; padding-left: 18px; }
    li { margin-bottom: 6px; }
    li::marker { color: #5a67d8; }
  `,
  classic: `
    body { font-family: 'Times New Roman', Times, serif; color: #000; }
    h1 { font-size: 24px; text-align: center; margin-bottom: 2px; font-weight: bold; }
    h2 { font-size: 12px; text-align: center; color: #333; margin-top: 0; font-style: italic; }
    h3 { font-size: 13px; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .contact { font-size: 11px; text-align: center; margin-bottom: 16px; }
    .contact span { margin: 0 10px; }
    .section-content { font-size: 11px; line-height: 1.5; text-align: justify; }
    ul { margin: 6px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }
  `,
  minimal: `
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; }
    h1 { font-size: 26px; color: #111827; margin-bottom: 4px; font-weight: 500; }
    h2 { font-size: 13px; color: #6b7280; margin-top: 0; font-weight: 400; }
    h3 { font-size: 12px; color: #374151; margin-top: 20px; margin-bottom: 10px; font-weight: 600; letter-spacing: 0.5px; }
    .contact { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
    .contact span { margin-right: 16px; }
    .section-content { font-size: 11px; line-height: 1.6; }
    ul { margin: 6px 0; padding-left: 16px; list-style-type: '–  '; }
    li { margin-bottom: 4px; }
  `,
  executive: `
    body { font-family: 'Garamond', 'Georgia', serif; color: #1a1a2e; }
    h1 { font-size: 30px; color: #16213e; margin-bottom: 4px; font-weight: normal; letter-spacing: 2px; }
    h2 { font-size: 14px; color: #0f3460; margin-top: 0; font-weight: normal; font-style: italic; }
    h3 { font-size: 14px; color: #0f3460; margin-top: 24px; margin-bottom: 12px; border-left: 3px solid #e94560; padding-left: 12px; font-weight: 600; }
    .contact { font-size: 11px; color: #4a5568; margin-bottom: 24px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
    .contact span { margin-right: 20px; }
    .section-content { font-size: 11px; line-height: 1.7; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 5px; }
  `,
};

const FONT_SIZES: Record<string, { body: string; h1: string; h3: string }> = {
  small: { body: '10px', h1: '22px', h3: '12px' },
  medium: { body: '11px', h1: '26px', h3: '14px' },
  large: { body: '12px', h1: '30px', h3: '16px' },
};

const MARGINS: Record<string, string> = {
  narrow: '0.5in',
  normal: '0.75in',
  wide: '1in',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ResumeExportService {
  private static instance: ResumeExportService;

  private constructor() {}

  static getInstance(): ResumeExportService {
    if (!ResumeExportService.instance) {
      ResumeExportService.instance = new ResumeExportService();
    }
    return ResumeExportService.instance;
  }

  /**
   * Export resume in specified format
   */
  async export(
    data: ResumeData,
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<Blob | string> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'docx':
        return this.exportToDocx(data, options);
      case 'txt':
        return this.exportToText(data);
      case 'html':
        return this.exportToHTML(data, options);
      case 'json':
        return this.exportToJSON(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF using print dialog
   */
  async exportToPDF(data: ResumeData, options: ExportOptions = {}): Promise<Blob> {
    const html = this.generateHTML(data, options);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    return new Promise((resolve, reject) => {
      printWindow.onload = () => {
        try {
          printWindow.focus();
          printWindow.print();
          
          // Create a blob from the HTML for download fallback
          const blob = new Blob([html], { type: 'text/html' });
          
          // Close the window after a short delay
          setTimeout(() => {
            printWindow.close();
          }, 1000);
          
          resolve(blob);
        } catch (error) {
          printWindow.close();
          reject(error);
        }
      };
    });
  }

  /**
   * Export to DOCX format (simplified - creates HTML that Word can open)
   */
  async exportToDocx(data: ResumeData, options: ExportOptions = {}): Promise<Blob> {
    const html = this.generateHTML(data, options);
    
    // Create a Word-compatible HTML document
    const wordDoc = `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8">
        <meta name="ProgId" content="Word.Document">
        <meta name="Generator" content="SproutCV">
        <style>
          @page { size: letter; margin: ${MARGINS[options.margins || 'normal']}; }
          ${TEMPLATE_STYLES[options.template || 'professional']}
        </style>
      </head>
      <body>
        ${this.generateBodyContent(data, options)}
      </body>
      </html>
    `;

    const blob = new Blob([wordDoc], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    return blob;
  }

  /**
   * Export to plain text
   */
  exportToText(data: ResumeData): string {
    const lines: string[] = [];
    
    // Header
    if (data.name) {
      lines.push(data.name.toUpperCase());
      lines.push('='.repeat(data.name.length));
    }
    
    if (data.jobTitle) {
      lines.push(data.jobTitle);
    }
    
    lines.push('');
    
    // Contact info
    const contactParts: string[] = [];
    if (data.email) contactParts.push(data.email);
    if (data.phone) contactParts.push(data.phone);
    if (data.location) contactParts.push(data.location);
    if (data.linkedin) contactParts.push(data.linkedin);
    if (data.website) contactParts.push(data.website);
    
    if (contactParts.length > 0) {
      lines.push(contactParts.join(' | '));
      lines.push('');
    }
    
    // Sections
    for (const section of data.sections) {
      lines.push('');
      lines.push(section.name.toUpperCase());
      lines.push('-'.repeat(section.name.length));
      lines.push(section.content);
    }
    
    return lines.join('\n');
  }

  /**
   * Export to HTML
   */
  exportToHTML(data: ResumeData, options: ExportOptions = {}): string {
    return this.generateHTML(data, options);
  }

  /**
   * Export to JSON
   */
  exportToJSON(data: ResumeData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate full HTML document
   */
  private generateHTML(data: ResumeData, options: ExportOptions = {}): string {
    const template = options.template || 'professional';
    const fontSize = options.fontSize || 'medium';
    const margin = options.margins || 'normal';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.name || 'Resume'} - ${data.jobTitle || 'Resume'}</title>
        <style>
          @page {
            size: letter;
            margin: ${MARGINS[margin]};
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            max-width: 8.5in;
            margin: 0 auto;
            padding: ${MARGINS[margin]};
            font-size: ${FONT_SIZES[fontSize].body};
            line-height: 1.5;
          }
          
          h1 { font-size: ${FONT_SIZES[fontSize].h1}; }
          h3 { font-size: ${FONT_SIZES[fontSize].h3}; }
          
          ${TEMPLATE_STYLES[template]}
          
          @media print {
            body {
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${this.generateBodyContent(data, options)}
      </body>
      </html>
    `;
  }

  /**
   * Generate body content
   */
  private generateBodyContent(data: ResumeData, options: ExportOptions = {}): string {
    const contactParts: string[] = [];
    if (data.email) contactParts.push(`<span>📧 ${data.email}</span>`);
    if (data.phone) contactParts.push(`<span>📱 ${data.phone}</span>`);
    if (data.location) contactParts.push(`<span>📍 ${data.location}</span>`);
    if (data.linkedin) contactParts.push(`<span>🔗 ${data.linkedin}</span>`);
    if (data.website) contactParts.push(`<span>🌐 ${data.website}</span>`);

    const sectionsHTML = data.sections.map(section => `
      <div class="section">
        <h3>${this.escapeHtml(section.name)}</h3>
        <div class="section-content">
          ${this.formatSectionContent(section.content)}
        </div>
      </div>
    `).join('');

    return `
      <header>
        ${data.name ? `<h1>${this.escapeHtml(data.name)}</h1>` : ''}
        ${data.jobTitle ? `<h2>${this.escapeHtml(data.jobTitle)}</h2>` : ''}
        ${contactParts.length > 0 ? `<div class="contact">${contactParts.join('')}</div>` : ''}
      </header>
      
      <main>
        ${sectionsHTML}
      </main>
      
      ${options.includeDate ? `
        <footer style="margin-top: 20px; font-size: 9px; color: #999; text-align: center;">
          Generated on ${new Date().toLocaleDateString()}
          ${data.companyName ? ` | Tailored for ${this.escapeHtml(data.companyName)}` : ''}
        </footer>
      ` : ''}
    `;
  }

  /**
   * Format section content (convert bullet points, etc.)
   */
  private formatSectionContent(content: string): string {
    // Split by newlines
    const lines = content.split('\n').filter(line => line.trim());
    
    // Check if it looks like a bullet list
    const bulletLines = lines.filter(line => 
      line.trim().startsWith('•') || 
      line.trim().startsWith('-') || 
      line.trim().startsWith('*') ||
      line.trim().match(/^\d+\./)
    );
    
    if (bulletLines.length > lines.length * 0.5) {
      // Format as list
      const items = lines.map(line => {
        const text = line.replace(/^[\s•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
        return `<li>${this.escapeHtml(text)}</li>`;
      });
      return `<ul>${items.join('')}</ul>`;
    }
    
    // Format as paragraphs
    return lines.map(line => `<p>${this.escapeHtml(line)}</p>`).join('');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, char => htmlEntities[char]);
  }

  /**
   * Download file to user's computer
   */
  download(content: Blob | string, filename: string, mimeType?: string): void {
    let blob: Blob;
    
    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType || 'text/plain' });
    } else {
      blob = content;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get available templates
   */
  getTemplates(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'professional', name: 'Professional', description: 'Clean, traditional style suitable for most industries' },
      { id: 'modern', name: 'Modern', description: 'Contemporary design with accent colors' },
      { id: 'classic', name: 'Classic', description: 'Timeless, centered layout' },
      { id: 'minimal', name: 'Minimal', description: 'Simple, whitespace-focused design' },
      { id: 'executive', name: 'Executive', description: 'Sophisticated style for senior positions' },
    ];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const resumeExportService = ResumeExportService.getInstance();
export default ResumeExportService;
