export interface ValidationThresholds {
  keyword: number;
  skills: number;
  experience: number;
  achievements: number;
}

export interface ValidationResult {
  hasSignificantMismatch: boolean;
  warnings: Warning[];
  details: DetailedAnalysisReport;
  confidence: number;
}

export interface Warning {
  id: string;
  type: WarningType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  explanation: string;
  importance: string;
  actions: WarningAction[];
  solutions: string[];
  examples: WarningExample[];
  dismissible: boolean;
  criticalityScore: number;
}

export type WarningType = 
  | 'keyword_mismatch'
  | 'skills_gap'
  | 'experience_mismatch'
  | 'achievements_missing'
  | 'industry_mismatch'
  | 'ats_incompatible'
  | 'seniority_mismatch'
  | 'role_mismatch';

export interface WarningAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  icon?: string;
}

export interface WarningExample {
  before: string;
  after: string;
  context?: string;
}

export interface DetailedAnalysisReport {
  keywords: KeywordAnalysisResult;
  skills: SkillsAnalysisResult;
  experience: ExperienceAnalysisResult;
  achievements: AchievementsAnalysisResult;
  industryAlignment: IndustryAlignmentResult;
  atsCompatibility: ATSCompatibilityResult;
}

export interface KeywordAnalysisResult {
  missingKeywords: MissingKeyword[];
  matchScore: number;
  criticalKeywords: CriticalKeyword[];
  semanticMatches: SemanticMatch[];
  keywordDensity: number;
  contextualRelevance: number;
}

export interface MissingKeyword {
  keyword: string;
  importance: number;
  category: string;
  alternatives: string[];
  contexts: string[];
}

export interface CriticalKeyword {
  keyword: string;
  criticality: number;
  frequency: number;
  alternatives: string[];
}

export interface SemanticMatch {
  jobKeyword: string;
  resumeKeyword: string;
  similarity: number;
  context: string;
}

export interface SkillsAnalysisResult {
  missingCriticalSkills: MissingSkill[];
  skillMatchScore: number;
  industryAlignment: number;
  skillCategories: SkillCategory[];
  levelMismatch: LevelMismatch[];
}

export interface MissingSkill {
  skill: string;
  category: 'technical' | 'soft' | 'domain';
  importance: number;
  alternatives: string[];
  learningResources: string[];
}

export interface SkillCategory {
  name: string;
  requiredSkills: string[];
  presentSkills: string[];
  coverage: number;
}

export interface LevelMismatch {
  skill: string;
  requiredLevel: string;
  presentLevel: string;
  gap: number;
}

export interface ExperienceAnalysisResult {
  yearsGap: number;
  roleAlignment: number;
  industryAlignment: number;
  seniorityMismatch: SeniorityMismatch;
  relevantExperiencePercentage: number;
}

export interface SeniorityMismatch {
  required: string;
  present: string;
  confidence: number;
  indicators: string[];
}

export interface AchievementsAnalysisResult {
  quantifiedAchievements: Achievement[];
  qualitativeAchievements: Achievement[];
  achievementScore: number;
  missingMetrics: string[];
  improvementOpportunities: string[];
}

export interface Achievement {
  text: string;
  isQuantified: boolean;
  metrics: string[];
  impact: string;
  improvements: string[];
}

export interface IndustryAlignmentResult {
  detectedIndustry: string;
  targetIndustry: string;
  alignmentScore: number;
  transferableSkills: string[];
  industryGaps: string[];
}

export interface ATSCompatibilityResult {
  score: number;
  issues: ATSIssue[];
  recommendations: string[];
  formatScore: number;
  contentScore: number;
}

export interface ATSIssue {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  solution: string;
}

// Error types for validation
export class ValidationError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SemanticAnalysisError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'SemanticAnalysisError';
  }
}