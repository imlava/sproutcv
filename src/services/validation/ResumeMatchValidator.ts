import { 
  ValidationResult, 
  Warning, 
  DetailedAnalysisReport,
  KeywordAnalysisResult,
  SkillsAnalysisResult,
  ExperienceAnalysisResult,
  AchievementsAnalysisResult,
  IndustryAlignmentResult,
  ATSCompatibilityResult,
  ATSIssue,
  ValidationError
} from '@/types/validation';
import { supabase } from '@/integrations/supabase/client';

export class ResumeMatchValidator {
  private static instance: ResumeMatchValidator | null = null;
  private isProcessing = false;

  private static readonly THRESHOLDS = {
    keywordMismatch: 0.6,
    atsScore: 0.5
  };

  private constructor() {}

  static getInstance(): ResumeMatchValidator {
    if (!ResumeMatchValidator.instance) {
      ResumeMatchValidator.instance = new ResumeMatchValidator();
    }
    return ResumeMatchValidator.instance;
  }

  async validateMatch(resumeText: string, jobDescription: string, userId?: string): Promise<ValidationResult> {
    if (this.isProcessing) {
      throw new ValidationError('Validation in progress', 'CONCURRENT_VALIDATION');
    }

    this.isProcessing = true;

    try {
      // Basic validation
      if (!resumeText?.trim() || !jobDescription?.trim()) {
        throw new ValidationError('Missing input', 'INVALID_INPUT');
      }

      if (resumeText.length < 10 || jobDescription.length < 10) {
        throw new ValidationError('Input too short', 'INSUFFICIENT_INPUT');
      }

      console.log('Starting quick resume validation...');

      // Quick analysis instead of deep analysis to prevent circular dependencies
      const analysis = this.performQuickAnalysis(resumeText, jobDescription);
      const warnings = this.filterWarnings(analysis);

      const result: ValidationResult = {
        hasSignificantMismatch: warnings.length > 0,
        warnings,
        details: analysis,
        confidence: 0.8
      };

      // Log validation results safely
      if (userId) {
        this.logValidationResults(userId, result).catch(error => {
          console.error('Failed to log validation results:', error);
        });
      }

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      throw error instanceof ValidationError ? error : 
        new ValidationError('Validation failed', 'VALIDATION_ERROR', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private performQuickAnalysis(resumeText: string, jobDescription: string): DetailedAnalysisReport {
    try {
      // Simple keyword matching without external dependencies
      const keywords = this.simpleKeywordAnalysis(resumeText, jobDescription);
      const ats = this.simpleATSCheck(resumeText);

    return {
        keywords,
        skills: this.getDefaultSkillsAnalysis(),
        experience: this.getDefaultExperienceAnalysis(),
        achievements: this.getDefaultAchievementsAnalysis(),
        industryAlignment: this.getDefaultIndustryAnalysis(),
        atsCompatibility: ats
      };
    } catch (error) {
      console.error('Quick analysis error:', error);
      return this.getDefaultAnalysis();
    }
  }

  private simpleKeywordAnalysis(resumeText: string, jobDescription: string): KeywordAnalysisResult {
    try {
      const jobWords = this.extractWords(jobDescription);
      const resumeWords = this.extractWords(resumeText);
      
      const matches = jobWords.filter(word => resumeWords.includes(word));
      const matchScore = jobWords.length > 0 ? matches.length / jobWords.length : 0.5;

    return {
        missingKeywords: [],
      matchScore,
        criticalKeywords: [],
        semanticMatches: [],
        keywordDensity: 0.1,
        contextualRelevance: matchScore
      };
    } catch (error) {
      console.error('Keyword analysis error:', error);
      return {
        missingKeywords: [],
        matchScore: 0.5,
        criticalKeywords: [],
        semanticMatches: [],
        keywordDensity: 0.1,
        contextualRelevance: 0.5
      };
    }
  }

  private simpleATSCheck(resumeText: string): ATSCompatibilityResult {
    try {
      const issues: ATSIssue[] = [];
      let score = 0.8;

      // Check for complex formatting that breaks ATS
      if (resumeText.includes('│') || resumeText.includes('─') || resumeText.includes('┌') || resumeText.includes('┐')) {
        issues.push({
          type: 'format',
          severity: 'MEDIUM',
          description: 'Complex table formatting detected',
          solution: 'Use simple text formatting instead of tables'
        });
        score -= 0.2;
      }

      // Check for email address
      if (!resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        issues.push({
          type: 'content',
          severity: 'HIGH',
          description: 'No email address found',
          solution: 'Add a professional email address to your contact information'
        });
        score -= 0.3;
      }

      // Check for phone number
      if (!resumeText.match(/[\+]?[\d\s\-\(\)]{10,}/)) {
        issues.push({
          type: 'content',
          severity: 'MEDIUM',
          description: 'No phone number found',
          solution: 'Add a phone number to your contact information'
        });
        score -= 0.1;
      }

      // Check for dates
      if (!resumeText.match(/\b\d{4}\b/)) {
        issues.push({
          type: 'content',
          severity: 'LOW',
          description: 'No dates found in resume',
          solution: 'Include dates for your work experience and education'
        });
        score -= 0.1;
      }

      return {
        score: Math.max(score, 0.1),
        issues,
        recommendations: issues.map(i => i.solution),
        formatScore: Math.max(score + 0.1, 0.2),
        contentScore: Math.max(score, 0.1)
      };
    } catch (error) {
      console.error('ATS check error:', error);
      return {
        score: 0.7,
        issues: [],
        recommendations: ['Review resume formatting'],
        formatScore: 0.7,
        contentScore: 0.7
      };
    }
  }

  private extractWords(text: string): string[] {
    try {
      const commonTechKeywords = [
        'javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker',
        'git', 'api', 'database', 'agile', 'scrum', 'leadership', 'management',
        'css', 'html', 'typescript', 'angular', 'vue', 'mongodb', 'mysql',
        'kubernetes', 'jenkins', 'azure', 'gcp', 'java', 'c++', 'php'
      ];

      const normalizedText = text.toLowerCase();
      const foundKeywords = commonTechKeywords.filter(keyword => 
        normalizedText.includes(keyword)
      );

      // Extract other significant words
      const words = normalizedText
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && word.length < 20)
        .filter(word => !this.isCommonWord(word))
        .slice(0, 100); // Limit to prevent memory issues

      return [...new Set([...foundKeywords, ...words])];
    } catch (error) {
      console.error('Word extraction error:', error);
      return [];
    }
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those',
      'will', 'would', 'could', 'should', 'have', 'has', 'had', 'been', 'being'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  private filterWarnings(analysis: DetailedAnalysisReport): Warning[] {
    const warnings: Warning[] = [];

    try {
      // Only add warnings for significant issues
      if (analysis.keywords.matchScore < ResumeMatchValidator.THRESHOLDS.keywordMismatch) {
        warnings.push({
          id: 'keyword_gap',
      type: 'keyword_mismatch',
          severity: 'HIGH',
          title: 'Keyword Gap Detected',
          description: 'Your resume is missing important keywords that appear in the job description',
          explanation: 'Adding relevant keywords will improve your ATS compatibility and show your qualifications',
          importance: 'High - Keywords are crucial for ATS systems',
      actions: [
            { id: 'fix_keywords', label: 'Show Missing Keywords', type: 'primary' },
            { id: 'dismiss', label: 'Dismiss', type: 'destructive' }
      ],
      solutions: [
            'Review the job description and incorporate relevant keywords naturally',
            'Add technical skills and tools mentioned in the job posting',
            'Use industry-standard terminology in your experience descriptions'
      ],
      examples: [
        {
              before: 'Worked on web development projects', 
              after: 'Developed React applications using JavaScript and Node.js' 
        }
      ],
      dismissible: true,
          criticalityScore: 1 - analysis.keywords.matchScore
        });
      }

      if (analysis.atsCompatibility.score < ResumeMatchValidator.THRESHOLDS.atsScore) {
        warnings.push({
          id: 'ats_issues',
          type: 'ats_incompatible',
          severity: 'MEDIUM',
          title: 'ATS Compatibility Issues',
          description: `Your resume has ${analysis.atsCompatibility.issues.length} formatting issues that may affect ATS parsing`,
          explanation: 'ATS systems need to parse your resume correctly to match you with job opportunities',
          importance: 'Medium - Affects initial screening process',
      actions: [
            { id: 'fix_ats', label: 'Fix Formatting', type: 'primary' },
            { id: 'dismiss', label: 'Dismiss', type: 'destructive' }
          ],
          solutions: analysis.atsCompatibility.recommendations,
      examples: [],
      dismissible: true,
          criticalityScore: 1 - analysis.atsCompatibility.score
        });
      }
    } catch (error) {
      console.error('Warning filtering error:', error);
    }

    return warnings;
  }

  private async logValidationResults(userId: string, result: ValidationResult): Promise<void> {
    try {
      await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: 'validation_completed',
          metadata: {
            hasSignificantMismatch: result.hasSignificantMismatch,
            warningCount: result.warnings.length,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
          } as any,
          severity: 'info'
        });
    } catch (error) {
      console.error('Failed to log validation results:', error);
      // Don't throw - logging failures shouldn't break validation
    }
  }

  // Default analysis methods for fallback
  private getDefaultSkillsAnalysis(): SkillsAnalysisResult {
    return {
      missingCriticalSkills: [],
      skillMatchScore: 0.7,
      industryAlignment: 0.7,
      skillCategories: [],
      levelMismatch: []
    };
  }

  private getDefaultExperienceAnalysis(): ExperienceAnalysisResult {
    return {
      yearsGap: 0,
      roleAlignment: 0.8,
      industryAlignment: 0.7,
      seniorityMismatch: {
        required: 'mid',
        present: 'mid',
        confidence: 0.8,
        indicators: []
      },
      relevantExperiencePercentage: 0.8
    };
  }

  private getDefaultAchievementsAnalysis(): AchievementsAnalysisResult {
    return {
      quantifiedAchievements: [],
      qualitativeAchievements: [],
      achievementScore: 0.6,
      missingMetrics: [],
      improvementOpportunities: []
    };
  }

  private getDefaultIndustryAnalysis(): IndustryAlignmentResult {
    return {
      detectedIndustry: 'technology',
      targetIndustry: 'technology',
      alignmentScore: 0.9,
      transferableSkills: [],
      industryGaps: []
    };
  }

  private getDefaultAnalysis(): DetailedAnalysisReport {
    return {
      keywords: {
        missingKeywords: [],
        matchScore: 0.5,
        criticalKeywords: [],
        semanticMatches: [],
        keywordDensity: 0.1,
        contextualRelevance: 0.5
      },
      skills: this.getDefaultSkillsAnalysis(),
      experience: this.getDefaultExperienceAnalysis(),
      achievements: this.getDefaultAchievementsAnalysis(),
      industryAlignment: this.getDefaultIndustryAnalysis(),
      atsCompatibility: {
        score: 0.7,
        issues: [],
        recommendations: [],
        formatScore: 0.7,
        contentScore: 0.7
      }
    };
  }
}