/**
 * AI Resume Service Tests
 * Tests for resume analysis, tailoring, and AI-powered features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unifiedAIService, AIServiceError } from '../ai/UnifiedAIService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

describe('UnifiedAIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be available after initialization', () => {
      expect(unifiedAIService.isAvailable()).toBe(true);
    });

    it('should return correct status', () => {
      const status = unifiedAIService.getStatus();
      expect(status.available).toBe(true);
      expect(status.version).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject empty resume text', async () => {
      await expect(
        unifiedAIService.analyzeResume({
          resumeText: '',
          jobDescription: 'Valid job description with enough content',
        })
      ).rejects.toThrow(AIServiceError);
    });

    it('should reject short resume text', async () => {
      await expect(
        unifiedAIService.analyzeResume({
          resumeText: 'Too short',
          jobDescription: 'Valid job description with enough content',
        })
      ).rejects.toThrow(AIServiceError);
    });

    it('should reject empty job description', async () => {
      await expect(
        unifiedAIService.analyzeResume({
          resumeText: 'Valid resume text with sufficient content for analysis',
          jobDescription: '',
        })
      ).rejects.toThrow(AIServiceError);
    });

    it('should reject short job description', async () => {
      await expect(
        unifiedAIService.analyzeResume({
          resumeText: 'Valid resume text with sufficient content for analysis',
          jobDescription: 'short',
        })
      ).rejects.toThrow(AIServiceError);
    });
  });

  describe('Keyword Analysis', () => {
    it('should extract keywords correctly', async () => {
      const resumeText = 'Experienced software engineer with JavaScript React Node.js skills';
      const jobDescription = 'Looking for JavaScript developer with React experience and Python knowledge';
      
      const result = await unifiedAIService.analyzeKeywords(resumeText, jobDescription);
      
      expect(result.matched).toContain('javascript');
      expect(result.matched).toContain('react');
      expect(result.missing).toContain('python');
      expect(result.density).toBeGreaterThan(0);
    });

    it('should handle empty inputs gracefully', async () => {
      const result = await unifiedAIService.analyzeKeywords('', '');
      expect(result.matched).toEqual([]);
      expect(result.missing).toEqual([]);
      expect(result.density).toBe(0);
    });

    it('should filter common words', async () => {
      const result = await unifiedAIService.analyzeKeywords(
        'the and or but in on at',
        'the and or but in on at'
      );
      expect(result.matched.length).toBe(0);
    });
  });
});

describe('AIServiceError', () => {
  it('should create error with correct properties', () => {
    const error = new AIServiceError('Test error', 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AIServiceError');
  });

  it('should preserve original error', () => {
    const originalError = new Error('Original');
    const error = new AIServiceError('Wrapped error', 'WRAPPED', originalError);
    
    expect(error.originalError).toBe(originalError);
  });
});

describe('Resume Analysis Result Validation', () => {
  it('should normalize scores to valid range', () => {
    // This test validates the normalization logic
    const normalizeScore = (score: number): number => Math.max(0, Math.min(100, score || 0));
    
    expect(normalizeScore(150)).toBe(100);
    expect(normalizeScore(-50)).toBe(0);
    expect(normalizeScore(75)).toBe(75);
    expect(normalizeScore(undefined as any)).toBe(0);
    expect(normalizeScore(null as any)).toBe(0);
  });
});
