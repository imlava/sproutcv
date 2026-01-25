/**
 * Resume Export Service Tests
 * Tests for PDF, DOCX, TXT, HTML, and JSON export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resumeExportService, ResumeData } from './ResumeExportService';

// Mock window.open for PDF export
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
  onload: null as (() => void) | null,
};

vi.stubGlobal('open', vi.fn(() => mockPrintWindow));

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

describe('ResumeExportService', () => {
  // Sample resume data for testing
  const sampleResume: ResumeData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'johndoe.com',
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    sections: [
      {
        id: 'summary',
        name: 'Professional Summary',
        content: 'Experienced software engineer with 10+ years of expertise in building scalable applications.',
      },
      {
        id: 'experience',
        name: 'Experience',
        content: '• Led development of microservices architecture\n• Managed team of 5 engineers\n• Increased system performance by 40%',
      },
      {
        id: 'skills',
        name: 'Skills',
        content: 'JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes',
      },
      {
        id: 'education',
        name: 'Education',
        content: 'B.S. Computer Science, MIT, 2012',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Export', () => {
    it('should export resume as plain text', () => {
      const result = resumeExportService.exportToText(sampleResume);
      
      expect(result).toContain('JOHN DOE');
      expect(result).toContain('Senior Software Engineer');
      expect(result).toContain('john@example.com');
      expect(result).toContain('PROFESSIONAL SUMMARY');
      expect(result).toContain('EXPERIENCE');
      expect(result).toContain('SKILLS');
      expect(result).toContain('EDUCATION');
    });

    it('should handle missing fields gracefully', () => {
      const minimalResume: ResumeData = {
        sections: [
          { id: '1', name: 'Summary', content: 'Test content' },
        ],
      };
      
      const result = resumeExportService.exportToText(minimalResume);
      
      expect(result).toContain('SUMMARY');
      expect(result).toContain('Test content');
    });

    it('should preserve section order', () => {
      const result = resumeExportService.exportToText(sampleResume);
      
      const summaryIndex = result.indexOf('PROFESSIONAL SUMMARY');
      const experienceIndex = result.indexOf('EXPERIENCE');
      const skillsIndex = result.indexOf('SKILLS');
      
      expect(summaryIndex).toBeLessThan(experienceIndex);
      expect(experienceIndex).toBeLessThan(skillsIndex);
    });
  });

  describe('HTML Export', () => {
    it('should generate valid HTML document', () => {
      const result = resumeExportService.exportToHTML(sampleResume, {
        template: 'professional',
      });
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
      expect(result).toContain('John Doe');
    });

    it('should apply template styles', () => {
      const professionalResult = resumeExportService.exportToHTML(sampleResume, {
        template: 'professional',
      });
      
      const modernResult = resumeExportService.exportToHTML(sampleResume, {
        template: 'modern',
      });
      
      // Different templates should produce different CSS
      expect(professionalResult).not.toBe(modernResult);
    });

    it('should escape HTML special characters', () => {
      const resumeWithSpecialChars: ResumeData = {
        name: 'John <script>alert("xss")</script> Doe',
        sections: [
          { id: '1', name: 'Test', content: 'Content with <b>tags</b> & symbols' },
        ],
      };
      
      const result = resumeExportService.exportToHTML(resumeWithSpecialChars, {});
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&amp;');
    });

    it('should include optional date footer when requested', () => {
      const withDate = resumeExportService.exportToHTML(sampleResume, {
        includeDate: true,
      });
      
      const withoutDate = resumeExportService.exportToHTML(sampleResume, {
        includeDate: false,
      });
      
      expect(withDate).toContain('Generated on');
      expect(withoutDate).not.toContain('Generated on');
    });

    it('should format bullet points as lists', () => {
      const result = resumeExportService.exportToHTML(sampleResume, {});
      
      // Experience section has bullet points
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });
  });

  describe('JSON Export', () => {
    it('should export resume as valid JSON', () => {
      const result = resumeExportService.exportToJSON(sampleResume);
      
      const parsed = JSON.parse(result);
      
      expect(parsed.name).toBe('John Doe');
      expect(parsed.sections).toHaveLength(4);
      expect(parsed.email).toBe('john@example.com');
    });

    it('should preserve all data fields', () => {
      const result = resumeExportService.exportToJSON(sampleResume);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(sampleResume);
    });
  });

  describe('Template Options', () => {
    it('should return available templates', () => {
      const templates = resumeExportService.getTemplates();
      
      expect(templates).toHaveLength(5);
      expect(templates.map(t => t.id)).toContain('professional');
      expect(templates.map(t => t.id)).toContain('modern');
      expect(templates.map(t => t.id)).toContain('classic');
      expect(templates.map(t => t.id)).toContain('minimal');
      expect(templates.map(t => t.id)).toContain('executive');
    });

    it('should provide descriptions for all templates', () => {
      const templates = resumeExportService.getTemplates();
      
      templates.forEach(template => {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
      });
    });
  });

  describe('Font Size Options', () => {
    it('should apply different font sizes', () => {
      const smallResult = resumeExportService.exportToHTML(sampleResume, {
        fontSize: 'small',
      });
      
      const largeResult = resumeExportService.exportToHTML(sampleResume, {
        fontSize: 'large',
      });
      
      expect(smallResult).toContain('10px');
      expect(largeResult).toContain('12px');
    });
  });

  describe('Margin Options', () => {
    it('should apply different margins', () => {
      const narrowResult = resumeExportService.exportToHTML(sampleResume, {
        margins: 'narrow',
      });
      
      const wideResult = resumeExportService.exportToHTML(sampleResume, {
        margins: 'wide',
      });
      
      expect(narrowResult).toContain('0.5in');
      expect(wideResult).toContain('1in');
    });
  });

  describe('Download Functionality', () => {
    it('should create and download a file', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      resumeExportService.download('test content', 'test.txt', 'text/plain');
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle Blob content', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      const blob = new Blob(['test'], { type: 'text/plain' });
      resumeExportService.download(blob, 'test.txt');
      
      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Export Format Selection', () => {
    it('should handle unsupported format', async () => {
      await expect(
        resumeExportService.export(sampleResume, 'invalid' as any)
      ).rejects.toThrow('Unsupported export format');
    });

    it('should route to correct export method', async () => {
      const txtResult = await resumeExportService.export(sampleResume, 'txt');
      expect(typeof txtResult).toBe('string');
      expect(txtResult).toContain('JOHN DOE');

      const jsonResult = await resumeExportService.export(sampleResume, 'json');
      expect(typeof jsonResult).toBe('string');
      expect(JSON.parse(jsonResult as string).name).toBe('John Doe');

      const htmlResult = await resumeExportService.export(sampleResume, 'html');
      expect(typeof htmlResult).toBe('string');
      expect(htmlResult).toContain('<!DOCTYPE html>');
    });
  });

  describe('Contact Information Formatting', () => {
    it('should include all contact info in text export', () => {
      const result = resumeExportService.exportToText(sampleResume);
      
      expect(result).toContain('john@example.com');
      expect(result).toContain('555-1234');
      expect(result).toContain('New York, NY');
      expect(result).toContain('linkedin.com/in/johndoe');
      expect(result).toContain('johndoe.com');
    });

    it('should include contact icons in HTML export', () => {
      const result = resumeExportService.exportToHTML(sampleResume, {});
      
      expect(result).toContain('📧'); // Email icon
      expect(result).toContain('📱'); // Phone icon
      expect(result).toContain('📍'); // Location icon
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      const emptyResume: ResumeData = {
        name: 'Test',
        sections: [],
      };
      
      const txtResult = resumeExportService.exportToText(emptyResume);
      expect(txtResult).toContain('TEST');
      
      const htmlResult = resumeExportService.exportToHTML(emptyResume, {});
      expect(htmlResult).toContain('Test');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const longResume: ResumeData = {
        sections: [
          { id: '1', name: 'Long Section', content: longContent },
        ],
      };
      
      const result = resumeExportService.exportToText(longResume);
      expect(result).toContain(longContent);
    });

    it('should handle unicode characters', () => {
      const unicodeResume: ResumeData = {
        name: '田中太郎',
        sections: [
          { id: '1', name: 'Résumé', content: 'Café ☕ → Success 🎉' },
        ],
      };
      
      const txtResult = resumeExportService.exportToText(unicodeResume);
      expect(txtResult).toContain('田中太郎');
      expect(txtResult).toContain('Café');
      expect(txtResult).toContain('☕');
      
      const htmlResult = resumeExportService.exportToHTML(unicodeResume, {});
      expect(htmlResult).toContain('田中太郎');
    });
  });
});
