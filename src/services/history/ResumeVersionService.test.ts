/**
 * Resume Version Service Tests
 * Tests for version history tracking and comparison
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

// Import after mocking
import { resumeVersionService, ResumeSection } from './ResumeVersionService';

describe('ResumeVersionService', () => {
  const testResumeId = 'test-resume-123';
  
  const sampleSections: ResumeSection[] = [
    { id: 'summary', name: 'Summary', content: 'Experienced professional...' },
    { id: 'experience', name: 'Experience', content: '• Led team of 5\n• Increased sales by 20%' },
    { id: 'skills', name: 'Skills', content: 'JavaScript, Python, AWS' },
  ];

  const sampleContent = sampleSections.map(s => `${s.name}\n${s.content}`).join('\n\n');

  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Version Creation', () => {
    it('should create a new version', () => {
      const version = resumeVersionService.createVersion(
        testResumeId,
        sampleContent,
        sampleSections,
        { jobTitle: 'Software Engineer' }
      );

      expect(version.id).toBeTruthy();
      expect(version.version).toBe(1);
      expect(version.content).toBe(sampleContent);
      expect(version.sections).toEqual(sampleSections);
      expect(version.metadata.jobTitle).toBe('Software Engineer');
    });

    it('should increment version number for subsequent versions', () => {
      resumeVersionService.createVersion(testResumeId, sampleContent, sampleSections);
      resumeVersionService.createVersion(testResumeId, sampleContent + ' updated', sampleSections);
      const v3 = resumeVersionService.createVersion(testResumeId, sampleContent + ' again', sampleSections);

      expect(v3.version).toBe(3);
    });

    it('should calculate word and character counts', () => {
      const content = 'Hello world this is a test';
      const version = resumeVersionService.createVersion(testResumeId, content, []);

      expect(version.metadata.wordCount).toBe(6);
      expect(version.metadata.characterCount).toBe(content.length);
    });

    it('should use custom name when provided', () => {
      const version = resumeVersionService.createVersion(
        testResumeId,
        sampleContent,
        sampleSections,
        {},
        'My Custom Version Name'
      );

      expect(version.name).toBe('My Custom Version Name');
    });

    it('should store timestamps', () => {
      const before = new Date().toISOString();
      const version = resumeVersionService.createVersion(testResumeId, sampleContent, sampleSections);
      const after = new Date().toISOString();

      expect(version.createdAt >= before).toBe(true);
      expect(version.createdAt <= after).toBe(true);
    });
  });

  describe('Version Retrieval', () => {
    it('should get all versions for a resume', () => {
      resumeVersionService.createVersion(testResumeId, 'v1', []);
      resumeVersionService.createVersion(testResumeId, 'v2', []);
      resumeVersionService.createVersion(testResumeId, 'v3', []);

      const versions = resumeVersionService.getVersions(testResumeId);
      
      expect(versions).toHaveLength(3);
    });

    it('should return newest version first', () => {
      resumeVersionService.createVersion(testResumeId, 'v1', [], {}, 'First');
      resumeVersionService.createVersion(testResumeId, 'v2', [], {}, 'Second');
      resumeVersionService.createVersion(testResumeId, 'v3', [], {}, 'Third');

      const versions = resumeVersionService.getVersions(testResumeId);
      
      expect(versions[0].name).toBe('Third');
      expect(versions[1].name).toBe('Second');
      expect(versions[2].name).toBe('First');
    });

    it('should get specific version by id', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', [], {}, 'First');
      const v2 = resumeVersionService.createVersion(testResumeId, 'v2', [], {}, 'Second');

      const retrieved = resumeVersionService.getVersion(testResumeId, v1.id);
      
      expect(retrieved?.name).toBe('First');
    });

    it('should get latest version', () => {
      resumeVersionService.createVersion(testResumeId, 'v1', [], {}, 'First');
      resumeVersionService.createVersion(testResumeId, 'v2', [], {}, 'Latest');

      const latest = resumeVersionService.getLatestVersion(testResumeId);
      
      expect(latest?.name).toBe('Latest');
    });

    it('should return empty array for non-existent resume', () => {
      const versions = resumeVersionService.getVersions('non-existent');
      expect(versions).toEqual([]);
    });

    it('should return undefined for non-existent version', () => {
      const version = resumeVersionService.getVersion(testResumeId, 'non-existent');
      expect(version).toBeUndefined();
    });
  });

  describe('Version Updates', () => {
    it('should update version name', () => {
      const version = resumeVersionService.createVersion(testResumeId, sampleContent, sampleSections);
      
      resumeVersionService.updateVersionName(testResumeId, version.id, 'Renamed Version');
      
      const updated = resumeVersionService.getVersion(testResumeId, version.id);
      expect(updated?.name).toBe('Renamed Version');
    });

    it('should add tags to version', () => {
      const version = resumeVersionService.createVersion(testResumeId, sampleContent, sampleSections);
      
      resumeVersionService.addTags(testResumeId, version.id, ['interview', 'final']);
      
      const updated = resumeVersionService.getVersion(testResumeId, version.id);
      expect(updated?.metadata.tags).toContain('interview');
      expect(updated?.metadata.tags).toContain('final');
    });

    it('should not duplicate tags', () => {
      const version = resumeVersionService.createVersion(
        testResumeId, 
        sampleContent, 
        sampleSections,
        { tags: ['existing'] }
      );
      
      resumeVersionService.addTags(testResumeId, version.id, ['existing', 'new']);
      
      const updated = resumeVersionService.getVersion(testResumeId, version.id);
      const tagCount = updated?.metadata.tags?.filter(t => t === 'existing').length;
      expect(tagCount).toBe(1);
    });
  });

  describe('Version Deletion', () => {
    it('should delete specific version', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', [], {}, 'First');
      resumeVersionService.createVersion(testResumeId, 'v2', [], {}, 'Second');

      const result = resumeVersionService.deleteVersion(testResumeId, v1.id);
      
      expect(result).toBe(true);
      expect(resumeVersionService.getVersions(testResumeId)).toHaveLength(1);
      expect(resumeVersionService.getVersion(testResumeId, v1.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent version', () => {
      const result = resumeVersionService.deleteVersion(testResumeId, 'non-existent');
      expect(result).toBe(false);
    });

    it('should delete all versions for a resume', () => {
      resumeVersionService.createVersion(testResumeId, 'v1', []);
      resumeVersionService.createVersion(testResumeId, 'v2', []);
      resumeVersionService.createVersion(testResumeId, 'v3', []);

      resumeVersionService.deleteAllVersions(testResumeId);
      
      expect(resumeVersionService.getVersions(testResumeId)).toHaveLength(0);
    });
  });

  describe('Version Comparison', () => {
    it('should compare two versions', () => {
      const sectionsV1: ResumeSection[] = [
        { id: 'summary', name: 'Summary', content: 'Original summary' },
        { id: 'skills', name: 'Skills', content: 'JavaScript, Python' },
      ];
      
      const sectionsV2: ResumeSection[] = [
        { id: 'summary', name: 'Summary', content: 'Updated summary with more details' },
        { id: 'skills', name: 'Skills', content: 'JavaScript, Python' },
        { id: 'experience', name: 'Experience', content: 'New section' },
      ];

      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', sectionsV1);
      const v2 = resumeVersionService.createVersion(testResumeId, 'v2', sectionsV2);

      const comparison = resumeVersionService.compareVersions(testResumeId, v1.id, v2.id);
      
      expect(comparison).not.toBeNull();
      expect(comparison?.summary.sectionsModified).toBe(1); // summary
      expect(comparison?.summary.sectionsAdded).toBe(1); // experience
      expect(comparison?.summary.sectionsRemoved).toBe(0);
    });

    it('should detect added sections', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', [
        { id: '1', name: 'Section 1', content: 'Content 1' },
      ]);
      const v2 = resumeVersionService.createVersion(testResumeId, 'v2', [
        { id: '1', name: 'Section 1', content: 'Content 1' },
        { id: '2', name: 'Section 2', content: 'Content 2' },
      ]);

      const comparison = resumeVersionService.compareVersions(testResumeId, v1.id, v2.id);
      const addedDiff = comparison?.diffs.find(d => d.sectionId === '2');
      
      expect(addedDiff?.type).toBe('added');
    });

    it('should detect removed sections', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', [
        { id: '1', name: 'Section 1', content: 'Content 1' },
        { id: '2', name: 'Section 2', content: 'Content 2' },
      ]);
      const v2 = resumeVersionService.createVersion(testResumeId, 'v2', [
        { id: '1', name: 'Section 1', content: 'Content 1' },
      ]);

      const comparison = resumeVersionService.compareVersions(testResumeId, v1.id, v2.id);
      const removedDiff = comparison?.diffs.find(d => d.sectionId === '2');
      
      expect(removedDiff?.type).toBe('removed');
    });

    it('should detect unchanged sections', () => {
      const sections: ResumeSection[] = [
        { id: '1', name: 'Section 1', content: 'Same content' },
      ];
      
      const v1 = resumeVersionService.createVersion(testResumeId, 'v1', sections);
      const v2 = resumeVersionService.createVersion(testResumeId, 'v2', sections);

      const comparison = resumeVersionService.compareVersions(testResumeId, v1.id, v2.id);
      
      expect(comparison?.diffs[0]?.type).toBe('unchanged');
    });

    it('should calculate word count change', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'one two three', []);
      const v2 = resumeVersionService.createVersion(testResumeId, 'one two three four five', []);

      const comparison = resumeVersionService.compareVersions(testResumeId, v1.id, v2.id);
      
      expect(comparison?.summary.wordCountChange).toBe(2);
    });

    it('should return null for invalid version ids', () => {
      const comparison = resumeVersionService.compareVersions(testResumeId, 'invalid1', 'invalid2');
      expect(comparison).toBeNull();
    });
  });

  describe('Version Restoration', () => {
    it('should restore a version as new version', () => {
      const v1 = resumeVersionService.createVersion(testResumeId, 'original', sampleSections, {}, 'Original');
      resumeVersionService.createVersion(testResumeId, 'modified', sampleSections, {}, 'Modified');

      const restored = resumeVersionService.restoreVersion(testResumeId, v1.id);
      
      expect(restored).not.toBeNull();
      expect(restored?.content).toBe('original');
      expect(restored?.name).toContain('Restored');
      expect(restored?.metadata.changeDescription).toContain('Restored from');
    });

    it('should return null for invalid version', () => {
      const restored = resumeVersionService.restoreVersion(testResumeId, 'invalid');
      expect(restored).toBeNull();
    });
  });

  describe('Export and Import', () => {
    it('should export version history as JSON', () => {
      resumeVersionService.createVersion(testResumeId, 'v1', sampleSections, {}, 'First');
      resumeVersionService.createVersion(testResumeId, 'v2', sampleSections, {}, 'Second');

      const exported = resumeVersionService.exportVersionHistory(testResumeId);
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Second');
    });

    it('should import version history from JSON', () => {
      const importData = JSON.stringify([
        {
          id: 'imported-1',
          version: 1,
          name: 'Imported Version',
          content: 'Imported content',
          sections: [],
          metadata: { wordCount: 2, characterCount: 16 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const result = resumeVersionService.importVersionHistory('import-test', importData);
      
      expect(result).toBe(true);
      expect(resumeVersionService.getVersions('import-test')).toHaveLength(1);
    });

    it('should reject invalid import data', () => {
      const result = resumeVersionService.importVersionHistory(testResumeId, 'invalid json');
      expect(result).toBe(false);
    });
  });

  describe('Storage Usage', () => {
    it('should report storage usage', () => {
      resumeVersionService.createVersion(testResumeId, 'test', sampleSections);
      
      const usage = resumeVersionService.getStorageUsage();
      
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.max).toBe(5 * 1024 * 1024);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Maximum Versions Limit', () => {
    it('should limit stored versions to maximum', () => {
      // Create more than max versions
      for (let i = 0; i < 55; i++) {
        resumeVersionService.createVersion(testResumeId, `v${i}`, [], {}, `Version ${i}`);
      }

      const versions = resumeVersionService.getVersions(testResumeId);
      
      expect(versions.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Metadata', () => {
    it('should store job-related metadata', () => {
      const version = resumeVersionService.createVersion(
        testResumeId,
        sampleContent,
        sampleSections,
        {
          jobTitle: 'Senior Developer',
          companyName: 'Tech Corp',
          atsScore: 85,
          keywordMatchScore: 72,
        }
      );

      expect(version.metadata.jobTitle).toBe('Senior Developer');
      expect(version.metadata.companyName).toBe('Tech Corp');
      expect(version.metadata.atsScore).toBe(85);
      expect(version.metadata.keywordMatchScore).toBe(72);
    });
  });
});
