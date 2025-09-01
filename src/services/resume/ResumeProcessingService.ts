import { AIService } from '../ai/AIService';
import { DocumentProcessor } from '../document/DocumentProcessor';
import { ATSOptimizer } from '../ats/ATSOptimizer';
import { QuotaManager } from '../quota/QuotaManager';
import { ErrorMonitoring } from '../monitoring/ErrorMonitoring';
import {
  ProcessingResult,
  ProcessingError,
  ImprovementSuggestion,
  ProcessingMetadata,
  AnalysisResult,
  ATSCompatibility
} from '@/types/analysis';

export class ResumeProcessingService {
  private aiService: AIService;
  private documentProcessor: DocumentProcessor;
  private atsOptimizer: ATSOptimizer;
  private quotaManager: QuotaManager;

  constructor() {
    this.aiService = AIService.getInstance();
    this.documentProcessor = new DocumentProcessor();
    this.atsOptimizer = new ATSOptimizer();
    this.quotaManager = new QuotaManager();
  }

  async processResume(
    file: File, 
    jobDescription: string, 
    userId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Check quotas first
      await this.quotaManager.checkQuota(userId);

      // Validate file
      if (!this.documentProcessor.isFileSupported(file)) {
        throw new ProcessingError('Unsupported file type or file too large');
      }

      // Extract text from resume
      console.log('Extracting text from resume...');
      const resumeText = await this.documentProcessor.extractText(file);
      
      if (!resumeText || resumeText.trim().length < 100) {
        throw new ProcessingError('Unable to extract sufficient text from resume');
      }

      // Get file metadata
      const fileMetadata = this.documentProcessor.getFileMetadata(file);
      const metadata: ProcessingMetadata = {
        fileSize: fileMetadata.size,
        fileType: fileMetadata.type,
        processingTime: 0,
        apiCalls: 0,
        cacheHit: false
      };

      // Perform initial ATS compatibility check
      console.log('Checking ATS compatibility...');
      const atsScore = await this.atsOptimizer.checkCompatibility(resumeText);

      // Get AI analysis
      console.log('Starting AI analysis...');
      const analysis = await this.aiService.analyzeResume(
        resumeText, 
        jobDescription, 
        userId,
        metadata
      );

      // Generate optimization suggestions
      console.log('Generating suggestions...');
      const suggestions = await this.generateSuggestions(analysis, atsScore);

      // Update metadata
      const processingTime = Date.now() - startTime;
      metadata.processingTime = processingTime;

      // Decrement quota
      await this.quotaManager.decrementQuota(userId);

      console.log(`Resume processing completed in ${processingTime}ms`);

      return {
        analysis,
        atsScore,
        suggestions,
        processingStatus: 'completed',
        metadata
      };

    } catch (error) {
      console.error('Resume Processing Error:', error);
      
      // Log error for monitoring
      await ErrorMonitoring.logError(error as Error, {
        userId,
        fileInfo: this.documentProcessor.getFileMetadata(file),
        timestamp: new Date().toISOString()
      });

      // Return error state
      throw new ProcessingError('Failed to process resume', error);
    }
  }

  private async generateSuggestions(
    analysis: AnalysisResult, 
    atsScore: ATSCompatibility
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    // Keyword suggestions
    if (analysis.keywordAnalysis.missing.length > 0) {
      suggestions.push({
        type: 'important',
        category: 'keywords',
        title: 'Add Missing Keywords',
        description: `Your resume is missing ${analysis.keywordAnalysis.missing.length} important keywords`,
        action: `Include these keywords: ${analysis.keywordAnalysis.missing.slice(0, 5).join(', ')}`,
        impact: 'Improve keyword match score by 15-25%',
        priority: 1
      });
    }

    // Skills gap suggestions
    if (analysis.skillsGap.missingSkills.length > 0) {
      const criticalSkills = analysis.skillsGap.missingSkills.filter(skill => 
        analysis.skillsGap.skillsPriority[skill] === 'critical'
      );

      if (criticalSkills.length > 0) {
        suggestions.push({
          type: 'critical',
          category: 'skills',
          title: 'Add Critical Skills',
          description: `You're missing ${criticalSkills.length} critical skills for this role`,
          action: `Highlight these skills if you have them: ${criticalSkills.slice(0, 3).join(', ')}`,
          impact: 'Significantly improve your match score',
          priority: 1
        });
      }
    }

    // Experience suggestions
    if (!analysis.experienceMatch.relevantExperience) {
      suggestions.push({
        type: 'critical',
        category: 'experience',
        title: 'Highlight Relevant Experience',
        description: 'Your resume doesn\'t clearly show relevant experience for this role',
        action: 'Restructure your experience section to emphasize relevant projects and responsibilities',
        impact: 'Dramatically improve experience relevance score',
        priority: 1
      });
    }

    // ATS-specific suggestions
    atsScore.issues.forEach(issue => {
      suggestions.push({
        type: issue.type === 'critical' ? 'critical' : issue.type === 'warning' ? 'important' : 'nice-to-have',
        category: 'formatting',
        title: `ATS Issue: ${issue.message}`,
        description: issue.message,
        action: issue.solution,
        impact: 'Improve ATS parsing and readability',
        priority: issue.type === 'critical' ? 1 : issue.type === 'warning' ? 2 : 3
      });
    });

    // Overall score improvement suggestions
    if (analysis.overallScore < 70) {
      suggestions.push({
        type: 'important',
        category: 'content',
        title: 'Overall Resume Improvement',
        description: 'Your overall match score is below 70%',
        action: 'Focus on adding relevant keywords, quantified achievements, and better formatting',
        impact: 'Comprehensive improvement across all metrics',
        priority: 1
      });
    }

    // Sort suggestions by priority and type
    return suggestions.sort((a, b) => {
      const typeOrder = { 'critical': 0, 'important': 1, 'nice-to-have': 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.priority - b.priority;
    });
  }

  // Public method to get processing status
  async getProcessingStatus(userId: string): Promise<{
    quota: any;
    rateLimits: any;
    cacheStats: any;
  }> {
    return {
      quota: await this.quotaManager.getUserQuota(userId),
      rateLimits: this.aiService.getRateLimitInfo(userId),
      cacheStats: this.aiService.getCacheStats()
    };
  }

  // Public method to get supported file types
  getSupportedFileTypes(): string[] {
    return this.documentProcessor.getSupportedTypes();
  }

  // Public method to get max file size
  getMaxFileSize(): number {
    return this.documentProcessor.getMaxFileSize();
  }

  // Public method to validate file before processing
  validateFile(file: File): { isValid: boolean; error?: string } {
    try {
      if (!this.documentProcessor.isFileSupported(file)) {
        return {
          isValid: false,
          error: `Unsupported file type or file too large. Supported types: ${this.getSupportedFileTypes().join(', ')}`
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'File validation failed'
      };
    }
  }

  // Public method to get optimization tips
  getOptimizationTips(): string[] {
    return this.atsOptimizer.getOptimizationTips();
  }
}