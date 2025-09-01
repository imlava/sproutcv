export interface AnalysisResult {
  overallScore: number;
  matchPercentage: number;
  keywordAnalysis: KeywordAnalysis;
  skillsGap: SkillsGapAnalysis;
  experienceMatch: ExperienceMatch;
  atsCompatibility: ATSCompatibility;
  improvements: ImprovementSuggestion[];
  industryContext: IndustryContext;
  processingTime: number;
  timestamp: string;
}

export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  suggested: string[];
  relevanceScores: Record<string, number>;
  density: number;
  distribution: Record<string, number>;
}

export interface SkillsGapAnalysis {
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  skillsPriority: Record<string, 'critical' | 'important' | 'nice-to-have'>;
  technicalSkills: string[];
  softSkills: string[];
}

export interface ExperienceMatch {
  yearRequired: number;
  yearFound: number;
  relevantExperience: boolean;
  industryMatch: boolean;
  roleMatch: boolean;
  seniorityMatch: boolean;
  experienceGaps: string[];
}

export interface ATSCompatibility {
  score: number;
  formatting: FormattingScore;
  structure: StructureScore;
  content: ContentScore;
  issues: ATSIssue[];
}

export interface FormattingScore {
  score: number;
  hasSimpleFormatting: boolean;
  hasProperHeadings: boolean;
  hasCleanStructure: boolean;
  hasReadableFonts: boolean;
}

export interface StructureScore {
  score: number;
  hasContactInfo: boolean;
  hasSummary: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
}

export interface ContentScore {
  score: number;
  keywordDensity: number;
  relevantContent: boolean;
  actionVerbs: boolean;
  quantifiedAchievements: boolean;
}

export interface ATSIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'formatting' | 'structure' | 'content';
  message: string;
  solution: string;
}

export interface ImprovementSuggestion {
  type: 'critical' | 'important' | 'nice-to-have';
  category: 'keywords' | 'experience' | 'skills' | 'formatting' | 'content';
  title: string;
  description: string;
  action: string;
  impact: string;
  priority: number;
}

export interface IndustryContext {
  industry: string;
  role: string;
  seniority: string;
  marketTrends: string[];
  competitiveSkills: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface ProcessingResult {
  analysis: AnalysisResult;
  atsScore: ATSCompatibility;
  suggestions: ImprovementSuggestion[];
  processingStatus: 'processing' | 'completed' | 'failed';
  metadata: ProcessingMetadata;
}

export interface ProcessingMetadata {
  fileSize: number;
  fileType: string;
  processingTime: number;
  apiCalls: number;
  cacheHit: boolean;
}

export interface QuotaInfo {
  remaining: number;
  total: number;
  resetDate: string;
  rateLimitRemaining: number;
}

export interface ErrorContext {
  userId?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

// Custom Error Classes
export class AIAnalysisError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class UnsupportedFileTypeError extends Error {
  constructor(fileType: string) {
    super(`Unsupported file type: ${fileType}`);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class DocumentProcessingError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}

export class QuotaExceededError extends Error {
  constructor(quotaType: string) {
    super(`Quota exceeded: ${quotaType}`);
    this.name = 'QuotaExceededError';
  }
}

export class RateLimitError extends Error {
  constructor(resetTime: string) {
    super(`Rate limit exceeded. Reset time: ${resetTime}`);
    this.name = 'RateLimitError';
  }
}