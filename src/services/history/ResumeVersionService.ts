/**
 * Resume Version Service
 * Tracks and manages resume version history
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeVersion {
  id: string;
  version: number;
  name: string;
  content: string;
  sections: ResumeSection[];
  metadata: VersionMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSection {
  id: string;
  name: string;
  content: string;
}

export interface VersionMetadata {
  jobTitle?: string;
  companyName?: string;
  keywordMatchScore?: number;
  atsScore?: number;
  wordCount: number;
  characterCount: number;
  isAutoSave?: boolean;
  changeDescription?: string;
  tags?: string[];
}

export interface VersionDiff {
  sectionId: string;
  sectionName: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldContent?: string;
  newContent?: string;
  addedLines: number;
  removedLines: number;
  changedPercentage: number;
}

export interface VersionComparison {
  oldVersion: ResumeVersion;
  newVersion: ResumeVersion;
  diffs: VersionDiff[];
  summary: {
    totalChanges: number;
    sectionsModified: number;
    sectionsAdded: number;
    sectionsRemoved: number;
    wordCountChange: number;
  };
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'sproutcv_resume_versions';
const MAX_VERSIONS = 50; // Maximum versions to keep

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ResumeVersionService {
  private static instance: ResumeVersionService;
  private versions: Map<string, ResumeVersion[]> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ResumeVersionService {
    if (!ResumeVersionService.instance) {
      ResumeVersionService.instance = new ResumeVersionService();
    }
    return ResumeVersionService.instance;
  }

  /**
   * Load versions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.versions = new Map(Object.entries(data));
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load version history:', error);
      this.versions = new Map();
      this.isInitialized = true;
    }
  }

  /**
   * Save versions to localStorage
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, ResumeVersion[]> = {};
      this.versions.forEach((versions, key) => {
        data[key] = versions;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Create a new version
   */
  createVersion(
    resumeId: string,
    content: string,
    sections: ResumeSection[],
    metadata: Partial<VersionMetadata> = {},
    name?: string
  ): ResumeVersion {
    const versions = this.getVersions(resumeId);
    const versionNumber = versions.length + 1;
    
    const newVersion: ResumeVersion = {
      id: this.generateId(),
      version: versionNumber,
      name: name || `Version ${versionNumber}`,
      content,
      sections,
      metadata: {
        wordCount: content.split(/\s+/).filter(w => w).length,
        characterCount: content.length,
        ...metadata,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to beginning (newest first)
    versions.unshift(newVersion);

    // Trim to max versions
    if (versions.length > MAX_VERSIONS) {
      versions.length = MAX_VERSIONS;
    }

    this.versions.set(resumeId, versions);
    this.saveToStorage();

    return newVersion;
  }

  /**
   * Get all versions for a resume
   */
  getVersions(resumeId: string): ResumeVersion[] {
    return this.versions.get(resumeId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(resumeId: string, versionId: string): ResumeVersion | undefined {
    const versions = this.getVersions(resumeId);
    return versions.find(v => v.id === versionId);
  }

  /**
   * Get the latest version
   */
  getLatestVersion(resumeId: string): ResumeVersion | undefined {
    const versions = this.getVersions(resumeId);
    return versions[0];
  }

  /**
   * Update version name
   */
  updateVersionName(resumeId: string, versionId: string, name: string): void {
    const versions = this.getVersions(resumeId);
    const version = versions.find(v => v.id === versionId);
    if (version) {
      version.name = name;
      version.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Add tags to a version
   */
  addTags(resumeId: string, versionId: string, tags: string[]): void {
    const versions = this.getVersions(resumeId);
    const version = versions.find(v => v.id === versionId);
    if (version) {
      version.metadata.tags = [...new Set([...(version.metadata.tags || []), ...tags])];
      version.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Delete a specific version
   */
  deleteVersion(resumeId: string, versionId: string): boolean {
    const versions = this.getVersions(resumeId);
    const index = versions.findIndex(v => v.id === versionId);
    if (index !== -1) {
      versions.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Delete all versions for a resume
   */
  deleteAllVersions(resumeId: string): void {
    this.versions.delete(resumeId);
    this.saveToStorage();
  }

  /**
   * Compare two versions
   */
  compareVersions(
    resumeId: string,
    oldVersionId: string,
    newVersionId: string
  ): VersionComparison | null {
    const oldVersion = this.getVersion(resumeId, oldVersionId);
    const newVersion = this.getVersion(resumeId, newVersionId);

    if (!oldVersion || !newVersion) {
      return null;
    }

    const diffs: VersionDiff[] = [];
    const allSectionIds = new Set([
      ...oldVersion.sections.map(s => s.id),
      ...newVersion.sections.map(s => s.id),
    ]);

    for (const sectionId of allSectionIds) {
      const oldSection = oldVersion.sections.find(s => s.id === sectionId);
      const newSection = newVersion.sections.find(s => s.id === sectionId);

      if (!oldSection && newSection) {
        // Section was added
        diffs.push({
          sectionId,
          sectionName: newSection.name,
          type: 'added',
          newContent: newSection.content,
          addedLines: newSection.content.split('\n').length,
          removedLines: 0,
          changedPercentage: 100,
        });
      } else if (oldSection && !newSection) {
        // Section was removed
        diffs.push({
          sectionId,
          sectionName: oldSection.name,
          type: 'removed',
          oldContent: oldSection.content,
          addedLines: 0,
          removedLines: oldSection.content.split('\n').length,
          changedPercentage: 100,
        });
      } else if (oldSection && newSection) {
        // Check if modified
        if (oldSection.content !== newSection.content) {
          const oldLines = oldSection.content.split('\n');
          const newLines = newSection.content.split('\n');
          
          // Simple diff calculation
          const { added, removed } = this.calculateLineDiff(oldLines, newLines);
          const totalLines = Math.max(oldLines.length, newLines.length);
          const changedPercentage = totalLines > 0 
            ? Math.round(((added + removed) / (totalLines * 2)) * 100) 
            : 0;

          diffs.push({
            sectionId,
            sectionName: newSection.name,
            type: 'modified',
            oldContent: oldSection.content,
            newContent: newSection.content,
            addedLines: added,
            removedLines: removed,
            changedPercentage,
          });
        } else {
          diffs.push({
            sectionId,
            sectionName: newSection.name,
            type: 'unchanged',
            oldContent: oldSection.content,
            newContent: newSection.content,
            addedLines: 0,
            removedLines: 0,
            changedPercentage: 0,
          });
        }
      }
    }

    return {
      oldVersion,
      newVersion,
      diffs,
      summary: {
        totalChanges: diffs.filter(d => d.type !== 'unchanged').length,
        sectionsModified: diffs.filter(d => d.type === 'modified').length,
        sectionsAdded: diffs.filter(d => d.type === 'added').length,
        sectionsRemoved: diffs.filter(d => d.type === 'removed').length,
        wordCountChange: newVersion.metadata.wordCount - oldVersion.metadata.wordCount,
      },
    };
  }

  /**
   * Calculate line differences (simplified)
   */
  private calculateLineDiff(
    oldLines: string[],
    newLines: string[]
  ): { added: number; removed: number } {
    const oldSet = new Set(oldLines.map(l => l.trim()));
    const newSet = new Set(newLines.map(l => l.trim()));

    let added = 0;
    let removed = 0;

    for (const line of newLines) {
      if (!oldSet.has(line.trim()) && line.trim()) {
        added++;
      }
    }

    for (const line of oldLines) {
      if (!newSet.has(line.trim()) && line.trim()) {
        removed++;
      }
    }

    return { added, removed };
  }

  /**
   * Restore a version as the current one
   */
  restoreVersion(resumeId: string, versionId: string): ResumeVersion | null {
    const version = this.getVersion(resumeId, versionId);
    if (!version) {
      return null;
    }

    // Create a new version based on the restored one
    return this.createVersion(
      resumeId,
      version.content,
      version.sections,
      {
        ...version.metadata,
        changeDescription: `Restored from "${version.name}"`,
      },
      `Restored: ${version.name}`
    );
  }

  /**
   * Auto-save with debouncing
   */
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  scheduleAutoSave(
    resumeId: string,
    content: string,
    sections: ResumeSection[],
    metadata: Partial<VersionMetadata> = {},
    delayMs: number = 30000 // 30 seconds default
  ): void {
    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(resumeId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new save
    const timer = setTimeout(() => {
      const latestVersion = this.getLatestVersion(resumeId);
      
      // Only save if content has changed
      if (!latestVersion || latestVersion.content !== content) {
        this.createVersion(resumeId, content, sections, {
          ...metadata,
          isAutoSave: true,
          changeDescription: 'Auto-saved',
        }, `Auto-save ${new Date().toLocaleTimeString()}`);
      }
      
      this.autoSaveTimers.delete(resumeId);
    }, delayMs);

    this.autoSaveTimers.set(resumeId, timer);
  }

  /**
   * Get storage usage
   */
  getStorageUsage(): { used: number; max: number; percentage: number } {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([data]).size;
    const max = 5 * 1024 * 1024; // 5MB (typical localStorage limit)
    
    return {
      used,
      max,
      percentage: Math.round((used / max) * 100),
    };
  }

  /**
   * Export all versions
   */
  exportVersionHistory(resumeId: string): string {
    const versions = this.getVersions(resumeId);
    return JSON.stringify(versions, null, 2);
  }

  /**
   * Import versions from backup
   */
  importVersionHistory(resumeId: string, jsonData: string): boolean {
    try {
      const versions = JSON.parse(jsonData) as ResumeVersion[];
      if (!Array.isArray(versions)) {
        throw new Error('Invalid version data');
      }
      
      this.versions.set(resumeId, versions);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import version history:', error);
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const resumeVersionService = ResumeVersionService.getInstance();
export default ResumeVersionService;
