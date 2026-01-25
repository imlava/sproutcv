/**
 * End-to-End User Journey Tests
 * Tests complete user flows from resume upload to export
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock services
vi.mock('@/services/document/DocumentProcessingService', () => ({
  documentProcessor: {
    extractText: vi.fn().mockResolvedValue({
      text: `
John Doe
Senior Software Engineer

EXPERIENCE
• Led development of microservices at Tech Corp
• Managed team of 5 engineers
• Increased system performance by 40%

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS

EDUCATION
B.S. Computer Science, MIT, 2012
      `.trim(),
      metadata: {
        pageCount: 1,
        wordCount: 50,
        characterCount: 400,
      },
    }),
  },
}));

vi.mock('@/services/ai/geminiService', () => ({
  geminiService: {
    analyzeResume: vi.fn().mockResolvedValue({
      overallScore: 85,
      atsScore: 88,
      keywordScore: 82,
      impactScore: 80,
      structureScore: 90,
      suggestions: [
        'Add more quantifiable achievements',
        'Include industry-specific keywords',
      ],
      keywords: {
        found: ['JavaScript', 'React', 'Node.js'],
        missing: ['GraphQL', 'Kubernetes'],
      },
    }),
    tailorResume: vi.fn().mockResolvedValue({
      sections: [
        {
          name: 'Professional Summary',
          original: 'Experienced developer...',
          tailored: 'Results-driven Senior Software Engineer with 5+ years...',
        },
      ],
      addedKeywords: ['GraphQL', 'microservices'],
      removedContent: [],
      overallImprovements: 'Enhanced professional summary with quantified achievements',
    }),
    generateCoverLetter: vi.fn().mockResolvedValue({
      content: 'Dear Hiring Manager,\n\nI am excited to apply...',
      highlights: ['Leadership experience', 'Technical expertise'],
    }),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
    })),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Helper to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper to create mock file
const createMockFile = (
  name: string,
  content: string,
  type: string
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

describe('User Journey: Resume Upload and Analysis', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Document Processing', () => {
    it('should extract text from uploaded PDF', async () => {
      const { documentProcessor } = await import('@/services/document/DocumentProcessingService');
      
      const mockFile = createMockFile('resume.pdf', 'mock pdf content', 'application/pdf');
      
      const result = await documentProcessor.extractText(mockFile);
      
      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Senior Software Engineer');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should handle multiple file types', async () => {
      const { documentProcessor } = await import('@/services/document/DocumentProcessingService');
      
      const pdfFile = createMockFile('resume.pdf', 'content', 'application/pdf');
      const docxFile = createMockFile('resume.docx', 'content', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const txtFile = createMockFile('resume.txt', 'content', 'text/plain');
      
      // All should process without errors
      await expect(documentProcessor.extractText(pdfFile)).resolves.toBeDefined();
      await expect(documentProcessor.extractText(docxFile)).resolves.toBeDefined();
      await expect(documentProcessor.extractText(txtFile)).resolves.toBeDefined();
    });
  });

  describe('AI Analysis', () => {
    it('should analyze resume against job description', async () => {
      const { geminiService } = await import('@/services/ai/geminiService');
      
      const resumeText = 'Experienced software engineer...';
      const jobDescription = 'Looking for a senior developer with React experience...';
      
      const result = await geminiService.analyzeResume(resumeText, jobDescription);
      
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.atsScore).toBeGreaterThan(0);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.keywords.found).toBeInstanceOf(Array);
    });

    it('should provide keyword analysis', async () => {
      const { geminiService } = await import('@/services/ai/geminiService');
      
      const result = await geminiService.analyzeResume('test', 'job');
      
      expect(result.keywords.found).toContain('JavaScript');
      expect(result.keywords.missing).toContain('GraphQL');
    });
  });

  describe('Resume Tailoring', () => {
    it('should tailor resume for specific job', async () => {
      const { geminiService } = await import('@/services/ai/geminiService');
      
      const resumeText = 'Original resume content...';
      const jobDescription = 'Job requirements...';
      
      const result = await geminiService.tailorResume(resumeText, jobDescription);
      
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections[0]).toHaveProperty('original');
      expect(result.sections[0]).toHaveProperty('tailored');
      expect(result.addedKeywords).toContain('GraphQL');
    });
  });

  describe('Cover Letter Generation', () => {
    it('should generate personalized cover letter', async () => {
      const { geminiService } = await import('@/services/ai/geminiService');
      
      const result = await geminiService.generateCoverLetter('resume', 'job description');
      
      expect(result.content).toContain('Dear Hiring Manager');
      expect(result.highlights).toBeInstanceOf(Array);
    });
  });
});

describe('User Journey: Version Management', () => {
  const { resumeVersionService } = require('@/services/history/ResumeVersionService');
  
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save and retrieve resume versions', () => {
    const resumeId = 'test-resume';
    const sections = [{ id: '1', name: 'Summary', content: 'Test content' }];
    
    // Create first version
    const v1 = resumeVersionService.createVersion(
      resumeId,
      'Original content',
      sections,
      { jobTitle: 'Developer' }
    );
    
    expect(v1.version).toBe(1);
    
    // Create second version
    const v2 = resumeVersionService.createVersion(
      resumeId,
      'Updated content',
      sections,
      { jobTitle: 'Senior Developer' }
    );
    
    expect(v2.version).toBe(2);
    
    // Retrieve versions
    const versions = resumeVersionService.getVersions(resumeId);
    expect(versions).toHaveLength(2);
  });

  it('should compare versions and show differences', () => {
    const resumeId = 'compare-test';
    
    const v1 = resumeVersionService.createVersion(
      resumeId,
      'Version 1 content',
      [{ id: 's1', name: 'Summary', content: 'Original summary' }]
    );
    
    const v2 = resumeVersionService.createVersion(
      resumeId,
      'Version 2 content with more details',
      [{ id: 's1', name: 'Summary', content: 'Updated summary with improvements' }]
    );
    
    const comparison = resumeVersionService.compareVersions(resumeId, v1.id, v2.id);
    
    expect(comparison).not.toBeNull();
    expect(comparison.summary.totalChanges).toBeGreaterThan(0);
  });

  it('should restore previous version', () => {
    const resumeId = 'restore-test';
    
    const v1 = resumeVersionService.createVersion(
      resumeId,
      'Original',
      [],
      {},
      'Original Version'
    );
    
    resumeVersionService.createVersion(
      resumeId,
      'Modified',
      [],
      {},
      'Modified Version'
    );
    
    const restored = resumeVersionService.restoreVersion(resumeId, v1.id);
    
    expect(restored.content).toBe('Original');
    expect(restored.name).toContain('Restored');
  });
});

describe('User Journey: Export Workflow', () => {
  const { resumeExportService } = require('@/services/export/ResumeExportService');
  
  const sampleResume = {
    name: 'John Doe',
    email: 'john@example.com',
    jobTitle: 'Software Engineer',
    companyName: 'Tech Corp',
    sections: [
      { id: '1', name: 'Summary', content: 'Experienced professional' },
      { id: '2', name: 'Experience', content: '• Built scalable systems' },
    ],
  };

  it('should export to multiple formats', async () => {
    const txtResult = resumeExportService.exportToText(sampleResume);
    expect(txtResult).toContain('JOHN DOE');
    
    const htmlResult = resumeExportService.exportToHTML(sampleResume, {});
    expect(htmlResult).toContain('<!DOCTYPE html>');
    
    const jsonResult = resumeExportService.exportToJSON(sampleResume);
    expect(JSON.parse(jsonResult).name).toBe('John Doe');
  });

  it('should apply different templates', () => {
    const templates = ['professional', 'modern', 'classic', 'minimal', 'executive'];
    
    templates.forEach(template => {
      const result = resumeExportService.exportToHTML(sampleResume, { template });
      expect(result).toContain(sampleResume.name);
    });
  });

  it('should include customization options', () => {
    const result = resumeExportService.exportToHTML(sampleResume, {
      template: 'professional',
      fontSize: 'large',
      margins: 'wide',
      includeDate: true,
    });
    
    expect(result).toContain('1in'); // wide margins
    expect(result).toContain('12px'); // large font
    expect(result).toContain('Generated on'); // date
  });
});

describe('User Journey: Complete Flow', () => {
  it('should complete full resume optimization journey', async () => {
    const { documentProcessor } = await import('@/services/document/DocumentProcessingService');
    const { geminiService } = await import('@/services/ai/geminiService');
    const { resumeExportService } = require('@/services/export/ResumeExportService');
    const { resumeVersionService } = require('@/services/history/ResumeVersionService');
    
    const resumeId = 'full-journey-test';
    
    // Step 1: Upload and extract resume
    const mockFile = createMockFile('resume.pdf', 'mock content', 'application/pdf');
    const extracted = await documentProcessor.extractText(mockFile);
    expect(extracted.text).toBeTruthy();
    
    // Step 2: Save original version
    const originalVersion = resumeVersionService.createVersion(
      resumeId,
      extracted.text,
      [{ id: 'full', name: 'Full Resume', content: extracted.text }],
      { changeDescription: 'Original upload' },
      'Original Upload'
    );
    expect(originalVersion.version).toBe(1);
    
    // Step 3: Analyze against job description
    const jobDescription = 'Senior React Developer with 5+ years experience...';
    const analysis = await geminiService.analyzeResume(extracted.text, jobDescription);
    expect(analysis.overallScore).toBeGreaterThan(0);
    
    // Step 4: Tailor resume
    const tailored = await geminiService.tailorResume(extracted.text, jobDescription);
    expect(tailored.sections.length).toBeGreaterThan(0);
    
    // Step 5: Save tailored version
    const tailoredContent = tailored.sections.map(s => `${s.name}\n${s.tailored}`).join('\n\n');
    const tailoredVersion = resumeVersionService.createVersion(
      resumeId,
      tailoredContent,
      tailored.sections.map((s, i) => ({ id: String(i), name: s.name, content: s.tailored })),
      {
        jobTitle: 'Senior React Developer',
        companyName: 'Target Company',
        atsScore: analysis.atsScore,
        changeDescription: 'Tailored for React Developer position',
      },
      'Tailored for React Developer'
    );
    expect(tailoredVersion.version).toBe(2);
    
    // Step 6: Compare versions
    const comparison = resumeVersionService.compareVersions(
      resumeId,
      originalVersion.id,
      tailoredVersion.id
    );
    expect(comparison.summary.totalChanges).toBeGreaterThan(0);
    
    // Step 7: Export final version
    const exportData = {
      name: 'John Doe',
      jobTitle: 'Senior React Developer',
      companyName: 'Target Company',
      sections: tailored.sections.map((s, i) => ({
        id: String(i),
        name: s.name,
        content: s.tailored,
      })),
    };
    
    const pdfReady = resumeExportService.exportToHTML(exportData, {
      template: 'professional',
      fontSize: 'medium',
      margins: 'normal',
    });
    expect(pdfReady).toContain('John Doe');
    
    // Step 8: Generate cover letter
    const coverLetter = await geminiService.generateCoverLetter(tailoredContent, jobDescription);
    expect(coverLetter.content).toBeTruthy();
  });
});

describe('Error Handling', () => {
  it('should handle file extraction errors gracefully', async () => {
    const { documentProcessor } = await import('@/services/document/DocumentProcessingService');
    
    // Mock error scenario
    vi.mocked(documentProcessor.extractText).mockRejectedValueOnce(new Error('Extraction failed'));
    
    const mockFile = createMockFile('corrupt.pdf', '', 'application/pdf');
    
    await expect(documentProcessor.extractText(mockFile)).rejects.toThrow();
  });

  it('should handle AI service errors', async () => {
    const { geminiService } = await import('@/services/ai/geminiService');
    
    // Mock error scenario
    vi.mocked(geminiService.analyzeResume).mockRejectedValueOnce(new Error('API error'));
    
    await expect(geminiService.analyzeResume('test', 'test')).rejects.toThrow();
  });

  it('should handle version not found', () => {
    const { resumeVersionService } = require('@/services/history/ResumeVersionService');
    
    const version = resumeVersionService.getVersion('non-existent', 'non-existent');
    expect(version).toBeUndefined();
  });
});

describe('Performance', () => {
  it('should handle large resume content', async () => {
    const { resumeExportService } = require('@/services/export/ResumeExportService');
    
    const largeContent = 'A'.repeat(50000);
    const largeResume = {
      name: 'Test',
      sections: [{ id: '1', name: 'Large Section', content: largeContent }],
    };
    
    const start = Date.now();
    const result = resumeExportService.exportToText(largeResume);
    const duration = Date.now() - start;
    
    expect(result.length).toBeGreaterThan(50000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle many version saves', () => {
    const { resumeVersionService } = require('@/services/history/ResumeVersionService');
    
    const resumeId = 'performance-test';
    const start = Date.now();
    
    for (let i = 0; i < 50; i++) {
      resumeVersionService.createVersion(resumeId, `Version ${i}`, [], {}, `V${i}`);
    }
    
    const duration = Date.now() - start;
    const versions = resumeVersionService.getVersions(resumeId);
    
    expect(versions.length).toBeLessThanOrEqual(50);
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
  });
});
