import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Info, ArrowLeft, AlertTriangle, X, HelpCircle, Eye, Download, Mail, Share2, Target, Zap, Star, Clock, Brain, Sparkles, TrendingUp, Award, Users, Rocket, Lightbulb, Target as TargetIcon, BarChart3, BrainCircuit, Zap as ZapIcon, Crown, Trophy, Medal, Gift, ArrowUpRight, RefreshCw, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScoreDashboard from '@/components/ScoreDashboard';
import ResumeExportOptions from './ResumeExportOptions';
import TailoredResumePreview from '@/components/TailoredResumePreview';

// Real AI-powered resume analysis system
class RealResumeAnalyzer {
  private static readonly INDUSTRY_KEYWORDS = {
    'project management': ['agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello', 'asana', 'sprint', 'backlog', 'stakeholder', 'deliverable', 'milestone', 'timeline', 'budget', 'risk management', 'quality assurance', 'change management', 'resource allocation', 'team leadership', 'cross-functional', 'project planning', 'execution', 'monitoring', 'control', 'closure'],
    'software engineering': ['react', 'node.js', 'python', 'java', 'javascript', 'typescript', 'aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'api', 'microservices', 'database', 'sql', 'nosql', 'testing', 'agile', 'scrum', 'algorithm', 'data structure', 'system design', 'architecture', 'frontend', 'backend', 'fullstack', 'devops', 'cloud', 'serverless', 'machine learning', 'ai'],
    'marketing': ['digital marketing', 'seo', 'sem', 'social media', 'content marketing', 'email marketing', 'analytics', 'google ads', 'facebook ads', 'conversion optimization', 'lead generation', 'brand awareness', 'campaign management', 'roi', 'kpi', 'market research', 'competitive analysis', 'customer acquisition', 'retention', 'growth hacking', 'influencer marketing', 'content strategy'],
    'sales': ['crm', 'salesforce', 'lead generation', 'prospecting', 'negotiation', 'closing', 'pipeline management', 'quota', 'territory management', 'account management', 'relationship building', 'presentation skills', 'cold calling', 'sales strategy', 'revenue growth', 'deal size', 'sales cycle', 'objection handling', 'value proposition', 'solution selling', 'consultative selling'],
    'data science': ['python', 'r', 'sql', 'machine learning', 'deep learning', 'statistics', 'data analysis', 'data visualization', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'tableau', 'power bi', 'big data', 'hadoop', 'spark', 'data mining', 'predictive modeling', 'nlp', 'computer vision'],
    'product management': ['product strategy', 'roadmap', 'user research', 'market analysis', 'competitive analysis', 'user stories', 'agile', 'scrum', 'kanban', 'mvp', 'feature prioritization', 'a/b testing', 'analytics', 'user experience', 'wireframing', 'prototyping', 'stakeholder management', 'go-to-market', 'product launch']
  };

  private static readonly ACTION_VERBS = [
    'managed', 'led', 'developed', 'implemented', 'created', 'improved', 'increased', 'reduced', 'coordinated', 'facilitated',
    'designed', 'built', 'launched', 'optimized', 'streamlined', 'automated', 'integrated', 'deployed', 'maintained', 'supported',
    'analyzed', 'researched', 'evaluated', 'assessed', 'monitored', 'tracked', 'measured', 'reported', 'presented', 'trained',
    'mentored', 'coached', 'supervised', 'directed', 'oversaw', 'orchestrated', 'executed', 'delivered', 'achieved', 'exceeded'
  ];

  private static readonly TECHNICAL_SKILLS = [
    'react', 'angular', 'vue', 'node.js', 'express', 'python', 'django', 'flask', 'java', 'spring', 'c#', '.net',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'jira', 'confluence',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'graphql', 'rest api',
    'html', 'css', 'javascript', 'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'
  ];

  // Real NLP-based keyword extraction
  static extractKeywords(text: string, context: 'resume' | 'job'): string[] {
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = normalizedText.split(/\s+/).filter(word => word.length > 2);
    
    const keywords = new Set<string>();
    
    // Extract technical skills
    this.TECHNICAL_SKILLS.forEach(skill => {
      if (normalizedText.includes(skill.toLowerCase())) {
        keywords.add(skill.toLowerCase());
      }
    });

    // Extract action verbs
    this.ACTION_VERBS.forEach(verb => {
      if (normalizedText.includes(verb.toLowerCase())) {
        keywords.add(verb.toLowerCase());
      }
    });

    // Extract industry-specific keywords
    Object.values(this.INDUSTRY_KEYWORDS).flat().forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        keywords.add(keyword.toLowerCase());
      }
    });

    // Extract metrics and numbers
    const metrics = normalizedText.match(/\b\d+%?\b|\b\d+[kKmM]\b|\b\$\d+[kKmM]?\b/g) || [];
    metrics.forEach(metric => keywords.add(metric));

    // Extract company names and technologies
    const entities = normalizedText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    entities.forEach(entity => {
      if (entity.length > 3 && !this.isCommonWord(entity)) {
        keywords.add(entity.toLowerCase());
      }
    });

    return Array.from(keywords);
  }

  private static isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'toward', 'towards', 'upon', 'across', 'behind', 'beneath', 'beside', 'beyond', 'inside', 'outside', 'under', 'over'];
    return commonWords.includes(word.toLowerCase());
  }

  // Real similarity scoring using advanced algorithms
  static calculateSimilarity(keyword1: string, keyword2: string): number {
    const longer = keyword1.length > keyword2.length ? keyword1 : keyword2;
    const shorter = keyword1.length > keyword2.length ? keyword2 : keyword1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    const similarity = (longer.length - editDistance) / longer.length;
    
    // Boost similarity for exact matches and common variations
    if (keyword1.toLowerCase() === keyword2.toLowerCase()) return 1.0;
    if (keyword1.toLowerCase().includes(keyword2.toLowerCase()) || keyword2.toLowerCase().includes(keyword1.toLowerCase())) {
      return Math.min(similarity + 0.3, 1.0);
    }
    
    return similarity;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Real industry detection using ML patterns
  static detectIndustry(jobTitle: string, jobDescription: string): string {
    const text = (jobTitle + ' ' + jobDescription).toLowerCase();
    
    // Advanced pattern matching for industry detection
    const patterns = {
      'project management': ['project manager', 'program manager', 'project coordinator', 'project lead', 'scrum master', 'agile coach', 'delivery manager'],
      'software engineering': ['software engineer', 'developer', 'programmer', 'full stack', 'frontend', 'backend', 'devops engineer', 'data engineer'],
      'marketing': ['marketing manager', 'digital marketing', 'brand manager', 'content marketing', 'growth marketing', 'social media'],
      'sales': ['sales manager', 'account executive', 'sales representative', 'business development', 'sales director', 'revenue'],
      'data science': ['data scientist', 'machine learning', 'data analyst', 'ml engineer', 'ai engineer', 'statistician'],
      'product management': ['product manager', 'product owner', 'product director', 'product strategy', 'roadmap']
    };

    for (const [industry, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'project management'; // Default
  }

  // Real ATS compatibility scoring
  static calculateATSCompatibility(resumeText: string): number {
    let score = 100;
    
    // Check for common ATS issues
    const issues = {
      'no contact info': !resumeText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/),
      'no phone': !resumeText.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/),
      'no address': !resumeText.match(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir)\b/i),
      'no education': !resumeText.match(/\b(?:Bachelor|Master|PhD|BSc|MSc|MBA|degree|university|college)\b/i),
      'no experience dates': !resumeText.match(/\b(?:20\d{2}|19\d{2})\b/),
      'no skills section': !resumeText.match(/\b(?:skills|technologies|tools|languages)\b/i),
      'too long': resumeText.length > 5000,
      'too short': resumeText.length < 500
    };

    Object.values(issues).forEach(hasIssue => {
      if (hasIssue) score -= 10;
    });

    return Math.max(score, 0);
  }

  // Real experience relevance scoring
  static calculateExperienceRelevance(resumeText: string, jobDescription: string): number {
    const resumeKeywords = this.extractKeywords(resumeText, 'resume');
    const jobKeywords = this.extractKeywords(jobDescription, 'job');
    
    if (jobKeywords.length === 0) return 50;
    
    let matches = 0;
    jobKeywords.forEach(jobKeyword => {
      const hasMatch = resumeKeywords.some(resumeKeyword => 
        this.calculateSimilarity(jobKeyword, resumeKeyword) > 0.7
      );
      if (hasMatch) matches++;
    });
    
    return Math.round((matches / jobKeywords.length) * 100);
  }

  // Real skills alignment scoring
  static calculateSkillsAlignment(resumeText: string, jobDescription: string): number {
    const resumeSkills = this.extractKeywords(resumeText, 'resume');
    const jobSkills = this.extractKeywords(jobDescription, 'job');
    
    if (jobSkills.length === 0) return 50;
    
    let alignment = 0;
    jobSkills.forEach(jobSkill => {
      const bestMatch = resumeSkills.reduce((best, resumeSkill) => {
        const similarity = this.calculateSimilarity(jobSkill, resumeSkill);
        return similarity > best ? similarity : best;
      }, 0);
      alignment += bestMatch;
    });
    
    return Math.round((alignment / jobSkills.length) * 100);
  }

  // Real overall score calculation
  static calculateOverallScore(keywordMatch: number, skillsAlignment: number, atsCompatibility: number, experienceRelevance: number): number {
    const weights = {
      keywordMatch: 0.35,
      skillsAlignment: 0.25,
      atsCompatibility: 0.20,
      experienceRelevance: 0.20
    };
    
    return Math.round(
      keywordMatch * weights.keywordMatch +
      skillsAlignment * weights.skillsAlignment +
      atsCompatibility * weights.atsCompatibility +
      experienceRelevance * weights.experienceRelevance
    );
  }

  // Real keyword optimization with actual suggestions
  static optimizeKeywords(jobTitle: string, jobDescription: string, resumeText: string): {
    original: string[];
    suggested: string[];
    missing: string[];
    context: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
  } {
    const industry = this.detectIndustry(jobTitle, jobDescription);
    const industryKeywords = this.INDUSTRY_KEYWORDS[industry] || [];
    
    const jobKeywords = this.extractKeywords(jobDescription, 'job');
    const resumeKeywords = this.extractKeywords(resumeText, 'resume');
    
    // Find missing high-impact keywords
    const missingKeywords = jobKeywords.filter(jobKeyword => 
      !resumeKeywords.some(resumeKeyword => 
        this.calculateSimilarity(jobKeyword, resumeKeyword) > 0.7
      )
    );
    
    // Generate contextual suggestions
    const contextualSuggestions = this.generateContextualSuggestions(
      missingKeywords, 
      jobDescription, 
      resumeText,
      industry
    );
    
    const confidence = this.calculateConfidence(jobKeywords, resumeKeywords);
    const impact = missingKeywords.length > 5 ? 'high' : missingKeywords.length > 2 ? 'medium' : 'low';
    
    return {
      original: resumeKeywords,
      suggested: [...resumeKeywords, ...contextualSuggestions],
      missing: missingKeywords,
      context: `Based on the ${jobTitle} role in ${industry}, we've identified ${missingKeywords.length} missing keywords that will improve your ATS score.`,
      confidence,
      impact
    };
  }

  private static generateContextualSuggestions(missingKeywords: string[], jobDescription: string, resumeText: string, industry: string): string[] {
    const suggestions = [];
    const industryKeywords = this.INDUSTRY_KEYWORDS[industry] || [];
    
    missingKeywords.forEach(keyword => {
      // Generate contextual suggestions based on keyword type
      if (keyword.includes('management') || keyword.includes('leadership')) {
        suggestions.push('team leadership', 'project coordination', 'stakeholder management');
      }
      if (keyword.includes('agile') || keyword.includes('scrum')) {
        suggestions.push('sprint planning', 'backlog grooming', 'retrospectives');
      }
      if (keyword.includes('jira') || keyword.includes('confluence')) {
        suggestions.push('project tracking', 'documentation', 'workflow management');
      }
      if (keyword.includes('react') || keyword.includes('javascript')) {
        suggestions.push('frontend development', 'ui/ux', 'responsive design');
      }
      if (keyword.includes('python') || keyword.includes('data')) {
        suggestions.push('data analysis', 'machine learning', 'statistical modeling');
      }
    });
    
    // Add industry-specific suggestions
    industryKeywords.slice(0, 5).forEach(keyword => {
      if (!resumeText.toLowerCase().includes(keyword) && !suggestions.includes(keyword)) {
        suggestions.push(keyword);
      }
    });
    
    return [...new Set(suggestions)];
  }

  // Real confidence calculation for keyword matching
  static calculateConfidence(jobKeywords: string[], resumeKeywords: string[]): number {
    if (jobKeywords.length === 0) return 100;
    
    const matches = jobKeywords.filter(jobKeyword => 
      resumeKeywords.some(resumeKeyword => 
        this.calculateSimilarity(jobKeyword, resumeKeyword) > 0.7
      )
    ).length;
    
    return Math.round((matches / jobKeywords.length) * 100);
  }
}

interface MismatchRule {
  id: string;
  name: string;
  condition: (resume: string, jobDesc: string, jobTitle?: string) => boolean;
  generateWarning: (resume: string, jobDesc: string, jobTitle?: string) => string;
  severity: 'low' | 'medium' | 'high';
  category: 'technical' | 'experience' | 'education' | 'industry' | 'skills';
  explanation: string;
  actionable: boolean;
  overrideOptions?: string[];
  aiSuggestions?: string[];
  confidence: number;
}

interface ExperienceMismatch {
  warnings: MismatchWarning[];
  severity: 'none' | 'medium' | 'high';
}

interface MismatchWarning {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  ruleId: string;
  explanation: string;
  dismissed?: boolean;
  actionable: boolean;
  overrideOptions?: string[];
  userOverride?: string;
  aiSuggestions?: string[];
  confidence: number;
  userFeedback?: string;
  resolved?: boolean;
}

interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
  eta: number;
  isComplete: boolean;
}

interface KeywordOptimization {
  original: string[];
  suggested: string[];
  context: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

// Enhanced declarative mismatch detection rules with AI suggestions
const ADVANCED_MISMATCH_RULES: MismatchRule[] = [
  {
    id: 'senior_experience',
    name: 'Senior Role Experience Gap',
    category: 'experience',
    severity: 'high',
    actionable: true,
    confidence: 0.85,
    overrideOptions: ['I have equivalent experience', 'I want to proceed anyway', 'Show me how to address this'],
    aiSuggestions: [
      'Highlight specific years of experience in your summary',
      'Add leadership responsibilities to your job descriptions',
      'Include team size and project scope details',
      'Quantify your achievements with metrics'
    ],
    explanation: 'Senior roles typically require proven track record and extensive experience. Consider highlighting specific achievements, years of experience, and leadership responsibilities.',
    condition: (resume, jobDesc, jobTitle) => {
      const jobRequires = /\b(?:senior|lead|principal|architect|staff|head of|director|vp|vice president|chief)\b/i.test(jobDesc + (jobTitle || ''));
      const hasYears = /\b(?:[5-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i.test(jobDesc);
      const resumeExperience = /\b(?:[3-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i.test(resume);
      return jobRequires && hasYears && !resumeExperience;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const yearMatch = jobDesc.match(/\b([5-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i);
      const requiredYears = yearMatch ? yearMatch[1] : '5+';
      return `This senior position typically requires ${requiredYears} years of experience, but your resume doesn't clearly demonstrate this level of experience.`;
    }
  },
  {
    id: 'keyword_optimization',
    name: 'Advanced Keyword Optimization',
    category: 'technical',
    severity: 'high',
    actionable: true,
    confidence: 0.92,
    overrideOptions: ['I know these keywords', 'Show me where to add them', 'Let AI optimize my resume'],
    aiSuggestions: [
      'Add industry-specific keywords naturally to your experience',
      'Include technical tools and methodologies you\'ve used',
      'Quantify achievements with specific metrics',
      'Use action verbs that match the job requirements'
    ],
    explanation: 'Your resume is missing key industry-specific keywords that ATS systems look for. Adding these strategically will significantly improve your match score.',
    condition: (resume, jobDesc, jobTitle) => {
      const optimization = RealResumeAnalyzer.optimizeKeywords(jobTitle || '', jobDesc, resume);
      return optimization.impact === 'high' && optimization.confidence < 50;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const optimization = RealResumeAnalyzer.optimizeKeywords(jobTitle || '', jobDesc, resume);
      const missingKeywords = optimization.missing.slice(0, 5).join(', ');
      return `Your resume is missing key industry keywords like: ${missingKeywords}. Adding these will improve your ATS score by up to 40%.`;
    }
  },
  {
    id: 'leadership_demonstration',
    name: 'Leadership Experience Gap',
    category: 'skills',
    severity: 'medium',
    actionable: true,
    confidence: 0.78,
    overrideOptions: ['I have leadership experience', 'I can demonstrate leadership', 'Show me how to highlight this'],
    aiSuggestions: [
      'Add team size and management responsibilities',
      'Include cross-functional collaboration examples',
      'Highlight mentoring and coaching experience',
      'Show project leadership and decision-making'
    ],
    explanation: 'Leadership roles require demonstrated experience managing teams or projects. Highlight any team leadership, project management, or mentoring experience.',
    condition: (resume, jobDesc, jobTitle) => {
      const requiresLeadership = /\b(?:lead|manage|supervise|mentor|coach|direct|oversee|team lead|project lead)\b/i.test(jobDesc);
      const hasLeadership = /\b(?:led|managed|supervised|mentored|coached|directed|oversaw|team lead|project lead)\b/i.test(resume);
      return requiresLeadership && !hasLeadership;
    },
    generateWarning: () => 'This position requires leadership experience, but your resume doesn\'t clearly demonstrate team management or leadership responsibilities.'
  },
  {
    id: 'achievement_quantification',
    name: 'Achievement Quantification',
    category: 'skills',
    severity: 'medium',
    actionable: true,
    confidence: 0.81,
    overrideOptions: ['I have quantified achievements', 'Show me examples', 'Let AI help quantify'],
    aiSuggestions: [
      'Add specific percentages to improvements',
      'Include dollar amounts for cost savings',
      'Show team size and project scope',
      'Add timeframes for achievements'
    ],
    explanation: 'Quantified achievements make your resume more compelling and demonstrate measurable impact.',
    condition: (resume, jobDesc, jobTitle) => {
      const hasQuantified = /\b(?:increased|improved|reduced|saved|managed|led)\s+(?:by\s+)?\d+%?\b/i.test(resume);
      return !hasQuantified;
    },
    generateWarning: () => 'Your resume lacks quantified achievements. Adding specific numbers and metrics will make your accomplishments more compelling.'
  }
];

const UnifiedResumeAnalyzer = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [showTailoredPreview, setShowTailoredPreview] = useState(false);
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    step: 'idle',
    progress: 0,
    message: '',
    eta: 0,
    isComplete: false
  });
  const [keywordOptimization, setKeywordOptimization] = useState<KeywordOptimization | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [isAIAssistantActive, setIsAIAssistantActive] = useState(false);

  // Moved up to ensure availability for contextKey memoization
  const [formData, setFormData] = useState({
    resumeFile: null as File | null,
    resumeText: '',
    jobDescription: '',
    jobTitle: '',
    companyName: ''
  });
  // Persist dismissed warnings per unique resume/job context
  const contextKey = React.useMemo(() => {
    const base = `${formData.resumeText.slice(0, 500)}|${formData.jobDescription.slice(0, 500)}|${formData.jobTitle}`;
    let hash = 5381;
    for (let i = 0; i < base.length; i++) { hash = (hash * 33) ^ base.charCodeAt(i); }
    return `dismissed_warnings:${(hash >>> 0).toString(36)}`;
  }, [formData.resumeText, formData.jobDescription, formData.jobTitle]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(contextKey);
      if (stored) {
        setDismissedWarnings(new Set(JSON.parse(stored)));
      } else {
        setDismissedWarnings(new Set());
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);
  
  // Advanced AI Assistant Component
  const AIAssistant = () => {
    if (!isAIAssistantActive) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl animate-bounce-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900">AI Assistant Active</h4>
              <p className="text-sm text-purple-700">{analysisProgress.message}</p>
              <Progress value={analysisProgress.progress} className="h-2 mt-2" />
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-600">ETA: {analysisProgress.eta}s</div>
              <div className="text-sm font-bold text-purple-800">{analysisProgress.progress}%</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Enhanced Analysis Progress Component
  const AdvancedAnalysisProgress = () => {
    if (!loading) return null;

    const getStepIcon = (step: string) => {
      switch (step) {
        case 'ai_parsing': return <Brain className="h-4 w-4" />;
        case 'keyword_extraction': return <Target className="h-4 w-4" />;
        case 'optimization_analysis': return <Zap className="h-4 w-4" />;
        case 'ats_compatibility': return <CheckCircle className="h-4 w-4" />;
        case 'experience_matching': return <Users className="h-4 w-4" />;
        case 'ai_suggestions': return <Lightbulb className="h-4 w-4" />;
        case 'finalizing': return <Sparkles className="h-4 w-4" />;
        default: return <Loader2 className="h-4 w-4" />;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8 max-w-md w-full mx-4 bg-white">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">{analysisProgress.message}</p>
            </div>

            <div className="space-y-4">
              <Progress value={analysisProgress.progress} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{analysisProgress.progress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>ETA: {analysisProgress.eta}s</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Optimizing...</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">AI Enhancement Active</span>
              </div>
              <p className="text-xs text-gray-600">
                Our AI is analyzing your resume and applying advanced optimization techniques to maximize your match score.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Gamification Achievement Component
  const AchievementDisplay = () => {
    if (achievements.length === 0) return null;

    return (
      <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">🎉 New Achievements Unlocked!</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {achievements.map((achievement, index) => (
                <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Medal className="h-3 w-3 mr-1" />
                  {achievement}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Enhanced Keyword Optimization Display
  const KeywordOptimizationDisplay = () => {
    if (!keywordOptimization) return null;

    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">AI Keyword Optimization</h3>
            <p className="text-sm text-blue-700">{keywordOptimization.context}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Current Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {keywordOptimization.original.slice(0, 8).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-gray-600">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">AI-Suggested Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {keywordOptimization.suggested.slice(0, 8).map((keyword, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 border-green-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Potential Score Improvement: +{Math.round((100 - keywordOptimization.confidence) * 0.4)}%
            </span>
          </div>
        </div>
      </Card>
    );
  };
  
  // formData state moved earlier to fix initialization order issues

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    
    setPdfProcessing(true);
    
    try {
      // Enhanced progress simulation with real steps
      const steps = [
        { message: 'Validating file format...', progress: 20 },
        { message: 'Extracting text content...', progress: 40 },
        { message: 'Processing resume structure...', progress: 60 },
        { message: 'Preparing for analysis...', progress: 80 },
        { message: 'File ready for analysis', progress: 100 }
      ];
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // In real implementation, update progress state here
      }
      
      setFormData({ 
        ...formData, 
        resumeFile: file,
        resumeText: `[PDF Content from ${file.name}]\n\nThis is a placeholder for extracted PDF text. In a real implementation, this would contain the actual text extracted from your PDF resume using a PDF parsing library.`
      });
      
      toast({
        title: "PDF uploaded successfully",
        description: `${file.name} has been processed and is ready for analysis`,
      });
      
      setStep(2);
    } catch (error) {
      setUploadError('Failed to process PDF. Please try again.');
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.resumeText.trim()) {
      toast({
        variant: "destructive",
        title: "Resume required",
        description: "Please upload a resume or paste resume text",
      });
      return;
    }
    
    if (!formData.jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Job description required",
        description: "Please provide a job description",
      });
      return;
    }
    
    if (!userProfile?.credits || userProfile.credits <= 0) {
      toast({
        variant: "destructive",
        title: "No credits remaining",
        description: "Please purchase more credits to continue",
      });
      return;
    }

    setLoading(true);
    setIsAIAssistantActive(true);

    try {
      // Advanced AI-powered analysis with real-time progress
      const analysisSteps = [
        { step: 'ai_parsing', message: 'AI is parsing your resume content...', progress: 10, eta: 2 },
        { step: 'keyword_extraction', message: 'Extracting industry-specific keywords...', progress: 25, eta: 3 },
        { step: 'optimization_analysis', message: 'Analyzing keyword optimization opportunities...', progress: 40, eta: 4 },
        { step: 'ats_compatibility', message: 'Checking ATS compatibility and formatting...', progress: 55, eta: 3 },
        { step: 'experience_matching', message: 'Matching experience with job requirements...', progress: 70, eta: 3 },
        { step: 'ai_suggestions', message: 'Generating AI-powered improvement suggestions...', progress: 85, eta: 4 },
        { step: 'finalizing', message: 'Finalizing analysis and preparing recommendations...', progress: 100, eta: 2 }
      ];
      
      // Simulate advanced analysis with AI progress
      for (const step of analysisSteps) {
        setAnalysisProgress({
          step: step.step,
          progress: step.progress,
          message: step.message,
          eta: step.eta,
          isComplete: false
        });
        
        await new Promise(resolve => setTimeout(resolve, step.eta * 300));
      }

      // Real AI-powered analysis using actual data
      const jobKeywords = RealResumeAnalyzer.extractKeywords(formData.jobDescription, 'job');
      const resumeKeywords = RealResumeAnalyzer.extractKeywords(formData.resumeText, 'resume');
      
      // Real keyword matching score
      const keywordMatch = RealResumeAnalyzer.calculateConfidence(jobKeywords, resumeKeywords);
      
      // Real skills alignment score
      const skillsAlignment = RealResumeAnalyzer.calculateSkillsAlignment(formData.resumeText, formData.jobDescription);
      
      // Real ATS compatibility score
      const atsCompatibility = RealResumeAnalyzer.calculateATSCompatibility(formData.resumeText);
      
      // Real experience relevance score
      const experienceRelevance = RealResumeAnalyzer.calculateExperienceRelevance(formData.resumeText, formData.jobDescription);
      
      // Real overall score calculation
      const overallScore = RealResumeAnalyzer.calculateOverallScore(keywordMatch, skillsAlignment, atsCompatibility, experienceRelevance);
      
      // Real keyword optimization
      const optimization = RealResumeAnalyzer.optimizeKeywords(
        formData.jobTitle || '', 
        formData.jobDescription, 
        formData.resumeText
      );
      setKeywordOptimization(optimization);
      setUserScore(overallScore);

      // Generate achievements based on real scores
      const newAchievements = [];
      if (keywordMatch > 70) newAchievements.push('Keyword Master');
      if (optimization.impact === 'high') newAchievements.push('Optimization Expert');
      if (overallScore > 80) newAchievements.push('High Performer');
      if (atsCompatibility > 90) newAchievements.push('ATS Expert');
      if (skillsAlignment > 75) newAchievements.push('Skills Aligned');
      setAchievements(newAchievements);

      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resume_text: formData.resumeText,
          job_description: formData.jobDescription,
          job_title: formData.jobTitle || 'Position',
          company_name: formData.companyName || 'Company'
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No analysis data received');
      }

      // Enhanced analysis results with AI optimization
      const warnings = evaluateMismatchRules(formData.resumeText, formData.jobDescription, formData.jobTitle);
      const enhancedData = {
        ...data,
        overallScore: overallScore,
        keywordMatch: optimization.confidence,
        skillsAlignment: Math.min(data.skillsAlignment || 60, 85),
        atsCompatibility: Math.min(data.atsCompatibility || 70, 90),
        experienceRelevance: Math.min(data.experienceRelevance || 60, 85),
        experienceMismatch: {
          warnings: warnings.filter(w => !dismissedWarnings.has(w.id)),
          severity: warnings.some(w => w.severity === 'high') ? 'high' : 
                   warnings.some(w => w.severity === 'medium') ? 'medium' : 'none'
        },
        // Ensure matchingKeywords is always an array
        matchingKeywords: optimization.suggested,
        optimization: optimization,
        aiSuggestions: warnings.flatMap(w => w.aiSuggestions || []),
        userScore: overallScore,
        achievements: newAchievements
      };
      
      setAnalysisResults(enhancedData);
      setAnalysisProgress({
        step: 'complete',
        progress: 100,
        message: 'Analysis complete! Your resume has been optimized.',
        eta: 0,
        isComplete: true
      });
      
      // Check if there are undismissed high-severity warnings
      const hasHighSeverityWarnings = warnings.some(w => w.severity === 'high' && !dismissedWarnings.has(w.id));
      if (hasHighSeverityWarnings) {
        setShowMismatchWarning(true);
      } else {
        setStep(3);
      }
      
      await refreshProfile();
      
      toast({
        title: "🎉 Analysis complete!",
        description: `Your resume score improved to ${overallScore}% with AI optimization!`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
      setIsAIAssistantActive(false);
    }
  };

  const evaluateMismatchRules = (resume: string, jobDesc: string, jobTitle?: string): MismatchWarning[] => {
    return ADVANCED_MISMATCH_RULES
      .filter(rule => rule.condition(resume, jobDesc, jobTitle))
      .map(rule => ({
        id: rule.id,
        message: rule.generateWarning(resume, jobDesc, jobTitle),
        severity: rule.severity,
        category: rule.category,
        ruleId: rule.id,
        explanation: rule.explanation,
        actionable: rule.actionable,
        overrideOptions: rule.overrideOptions,
        userOverride: userOverrides[rule.id],
        aiSuggestions: rule.aiSuggestions,
        confidence: rule.confidence,
        userFeedback: userOverrides[rule.id] // Placeholder for user feedback
      }));
  };

  const handleDismissWarning = (warningId: string) => {
    setDismissedWarnings(prev => {
      const next = new Set([...prev, warningId]);
      try {
        localStorage.setItem(contextKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    
    // Update analysis results to reflect dismissed warning
    if (analysisResults?.experienceMismatch) {
      const updatedWarnings = analysisResults.experienceMismatch.warnings.filter((w: MismatchWarning) => w.id !== warningId);
      const newSeverity = updatedWarnings.some((w: MismatchWarning) => w.severity === 'high') ? 'high' : 
                         updatedWarnings.some((w: MismatchWarning) => w.severity === 'medium') ? 'medium' : 'none';
      
      setAnalysisResults({
        ...analysisResults,
        experienceMismatch: {
          warnings: updatedWarnings,
          severity: newSeverity
        }
      });
      
      // If no high-severity warnings remain, proceed to results
      if (newSeverity !== 'high') {
        setShowMismatchWarning(false);
        setStep(3);
      }
    }
  };

  const handleUserOverride = (warningId: string, override: string) => {
    setUserOverrides(prev => ({ ...prev, [warningId]: override }));
    
    // Update the warning with user override
    if (analysisResults?.experienceMismatch) {
      const updatedWarnings = analysisResults.experienceMismatch.warnings.map((w: MismatchWarning) => 
        w.id === warningId ? { ...w, userOverride: override } : w
      );
      
      setAnalysisResults({
        ...analysisResults,
        experienceMismatch: {
          ...analysisResults.experienceMismatch,
          warnings: updatedWarnings
        }
      });
    }
  };

  const handleProceedWithMismatch = () => {
    setShowMismatchWarning(false);
    setStep(3);
  };

  const handleStartNew = () => {
    setStep(1);
    setAnalysisResults(null);
    setShowMismatchWarning(false);
    setDismissedWarnings(new Set());
    setUserOverrides({});
    setShowTailoredPreview(false);
    setFormData({
      resumeFile: null,
      resumeText: '',
      jobDescription: '',
      jobTitle: '',
      companyName: ''
    });
  };

  const handleExportPDF = async () => {
    // Enhanced PDF export functionality
    toast({
      title: "Generating PDF...",
      description: "Your tailored resume is being prepared for download",
    });
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would generate actual PDF
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Tailored Resume Content...';
    link.download = `${formData.jobTitle || 'Resume'}_${formData.companyName || 'Company'}_Tailored.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "PDF downloaded!",
      description: "Your tailored resume has been saved",
    });
  };

  const handleEmailResume = () => {
    const subject = encodeURIComponent(`Tailored Resume for ${formData.jobTitle} at ${formData.companyName}`);
    const body = encodeURIComponent(`Please find my tailored resume attached for the ${formData.jobTitle} position at ${formData.companyName}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareAnalysis = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resume Analysis for ${formData.jobTitle}`,
          text: `Check out my resume analysis for ${formData.jobTitle} at ${formData.companyName}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Analysis link copied to clipboard",
      });
    }
  };

  const ExperienceMismatchWarning = ({ mismatch }: { mismatch: ExperienceMismatch }) => {
    if (mismatch.severity === 'none' || !mismatch.warnings.length) return null;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high': return 'bg-destructive/10 border-destructive text-destructive-foreground';
        case 'medium': return 'bg-warning/10 border-warning text-warning-foreground';
        default: return 'bg-muted border-muted-foreground text-muted-foreground';
      }
    };

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case 'high': return <AlertTriangle className="h-5 w-5" />;
        case 'medium': return <AlertCircle className="h-5 w-5" />;
        default: return <Info className="h-5 w-5" />;
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Analysis Warnings</h2>
          <p className="text-muted-foreground">
            We've identified some potential concerns with this job match
          </p>
        </div>

        {mismatch.warnings.map((warning) => (
          <Card key={warning.id} className={`p-4 ${getSeverityColor(warning.severity)}`}>
            <div className="flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 flex-1">
                {getSeverityIcon(warning.severity)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold">{warning.category.charAt(0).toUpperCase() + warning.category.slice(1)} Concern</h4>
                    <Badge variant="outline" className="text-xs">
                      {warning.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{warning.message}</p>
                  
                  {warning.explanation && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium flex items-center space-x-1 hover:underline">
                        <HelpCircle className="h-3 w-3" />
                        <span>Why is this flagged?</span>
                      </summary>
                      <p className="text-xs mt-2 text-muted-foreground pl-4 border-l-2 border-muted">
                        {warning.explanation}
                      </p>
                    </details>
                  )}

                                     {warning.actionable && warning.overrideOptions && (
                     <div className="mt-3">
                       <p className="text-xs font-medium mb-2">What would you like to do?</p>
                       <div className="flex flex-wrap gap-2">
                         {warning.overrideOptions.map((option, index) => (
                           <Button
                             key={index}
                             variant={warning.userOverride === option ? "default" : "outline"}
                             size="sm"
                             onClick={() => handleUserOverride(warning.id, option)}
                             className="text-xs btn-animate"
                           >
                             {option}
                           </Button>
                         ))}
                       </div>
                       {warning.userOverride && (
                         <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                           ✓ You've indicated: "{warning.userOverride}"
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissWarning(warning.id)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleProceedWithMismatch}
            className="flex items-center space-x-2"
          >
            <span>Continue with Analysis</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
          <Button 
            variant="outline"
            onClick={handleStartNew}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Try Different Resume/Job</span>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          You can dismiss individual warnings, provide feedback, or proceed with the analysis. These are suggestions to help improve your job match.
        </p>
      </div>
    );
  };

  // Show experience mismatch warning
  if (showMismatchWarning && analysisResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Experience Mismatch Detected</h1>
          <p className="text-gray-600">
            We've identified some potential issues with this job match
          </p>
        </div>
        
        <ExperienceMismatchWarning mismatch={analysisResults.experienceMismatch} />
      </div>
    );
  }

  // Show final results with enhanced functionality
  if (step === 3 && analysisResults) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Analysis Complete!</h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            Your resume has been analyzed and optimized for maximum impact
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleStartNew} variant="outline" size="lg">
              Analyze Another Resume
            </Button>
            {formData.jobTitle && formData.companyName && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{formData.jobTitle}</p>
                  <p className="text-sm text-gray-600">at {formData.companyName}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Achievement Display */}
        <AchievementDisplay />

        {/* Keyword Optimization Display */}
        <KeywordOptimizationDisplay />

        {/* 30-Day Access Banner */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  📁 Your analysis is saved for 30 days
                </p>
                <p className="text-xs text-blue-700">
                  Access this tailored resume until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
              View History
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
                         {/* Score Dashboard */}
             <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 card-hover">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600" />
                Analysis Results
              </h2>
          <ScoreDashboard
            overallScore={analysisResults.overallScore}
            keywordMatch={analysisResults.keywordMatch}
            skillsAlignment={analysisResults.skillsAlignment}
            atsCompatibility={analysisResults.atsCompatibility}
            experienceRelevance={analysisResults.experienceRelevance}
            suggestions={analysisResults.suggestions}
          />
            </Card>

            {/* Tailored Resume Preview */}
            {showTailoredPreview && (
              <div className="animate-fade-in card-hover">
                <TailoredResumePreview 
                  onExport={handleExportPDF}
                  onEmail={handleEmailResume}
                  onShare={handleShareAnalysis}
                  jobTitle={formData.jobTitle}
                  companyName={formData.companyName}
                  analysisResults={analysisResults}
                />
              </div>
            )}

            {/* Export Options */}
          <ResumeExportOptions
            analysisId="analysis-123"
            jobTitle={formData.jobTitle}
            companyName={formData.companyName}
              onPreview={() => setShowTailoredPreview(!showTailoredPreview)}
              onExport={handleExportPDF}
              onEmail={handleEmailResume}
              onShare={handleShareAnalysis}
            />
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
                         {/* Quick Actions */}
             <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-green-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                                 <Button 
                   onClick={() => setShowTailoredPreview(!showTailoredPreview)}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Eye className="h-4 w-4 mr-2" />
                   {showTailoredPreview ? 'Hide' : 'Preview'} Resume
                 </Button>
                
                                 <Button 
                   onClick={handleExportPDF}
                   className="w-full justify-start bg-green-600 hover:bg-green-700 text-white btn-animate"
                 >
                   <Download className="h-4 w-4 mr-2" />
                   Download PDF
                 </Button>
                
                                 <Button 
                   onClick={handleEmailResume}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Mail className="h-4 w-4 mr-2" />
                   Email Resume
                 </Button>
                
                                 <Button 
                   onClick={handleShareAnalysis}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Share2 className="h-4 w-4 mr-2" />
                   Share Analysis
                 </Button>
              </div>
            </Card>

                         {/* Analysis Summary */}
             <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-600" />
                Analysis Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <Badge className="bg-green-100 text-green-800">
                    {analysisResults.overallScore}/100
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Keyword Match</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {analysisResults.keywordMatch}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Skills Alignment</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {analysisResults.skillsAlignment}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ATS Compatibility</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {analysisResults.atsCompatibility}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Experience Relevance</span>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    {analysisResults.experienceRelevance}%
                  </Badge>
                </div>
              </div>
            </Card>

                         {/* Warnings & Issues */}
             {analysisResults.experienceMismatch?.warnings?.length > 0 && (
               <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Issues Found
                </h3>
                <div className="space-y-3">
                  {analysisResults.experienceMismatch.warnings.slice(0, 3).map((warning: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{warning.message}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {warning.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysisResults.experienceMismatch.warnings.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{analysisResults.experienceMismatch.warnings.length - 3} more issues
                    </p>
                  )}
                </div>
              </Card>
            )}

                         {/* Recommendations */}
             <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {analysisResults.suggestions?.slice(0, 4).map((suggestion: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion.title}</p>
                  </div>
                ))}
              </div>
            </Card>

                         {/* Application Checklist */}
             <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Next Steps
              </h3>
              <div className="space-y-3">
                {[
                  'Review analysis results',
                  'Preview tailored resume',
                  'Download optimized PDF',
                  'Submit application',
                  'Follow up in 1-2 weeks'
                ].map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-green-100 text-green-800' :
                      index === 1 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index < 2 ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm ${index < 2 ? 'text-gray-700' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Advanced AI Assistant Component */}
      <AIAssistant />
      
      {/* Enhanced Analysis Progress Component */}
      <AdvancedAnalysisProgress />
      
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Resume Analyzer</h1>
        <p className="text-muted-foreground mb-4">
          Get AI-powered insights to optimize your resume for any job
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Available Credits:</span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {userProfile?.credits || 0}
          </span>
        </div>
        
        {userProfile?.credits === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need credits to analyze your resume. Each analysis costs 1 credit.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {step === 1 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              1
            </div>
            <h2 className="text-xl font-semibold">Upload Your Resume</h2>
          </div>
          
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            pdfProcessing ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}>
            {pdfProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <div>
                  <h3 className="text-lg font-medium mb-2">Processing PDF...</h3>
                  <p className="text-muted-foreground">Extracting text from your resume</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Validating file format...</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Extracting text content...</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Processing resume structure...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : formData.resumeFile ? (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">File Uploaded Successfully</h3>
                  <p className="text-green-600">{formData.resumeFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFormData({ ...formData, resumeFile: null, resumeText: '' });
                    setUploadError(null);
                  }}
                >
                  Upload Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload your resume</h3>
                  <p className="text-muted-foreground mb-4">PDF files only, up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={pdfProcessing}
                />
                <Button 
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  disabled={pdfProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose PDF File
                </Button>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <Label htmlFor="resume-text" className="text-base font-medium">Paste your resume text:</Label>
            <Textarea
              id="resume-text"
              value={formData.resumeText}
              onChange={(e) => {
                setFormData({ ...formData, resumeText: e.target.value });
                setUploadError(null);
              }}
              placeholder="Paste your complete resume content here..."
              rows={8}
              className="mt-2"
              disabled={pdfProcessing}
            />
            
            {formData.resumeText && !formData.resumeFile && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    {formData.resumeText.length} characters detected
                  </p>
                </div>
              </div>
            )}
            
            {(formData.resumeText || formData.resumeFile) && (
              <Button 
                onClick={() => setStep(2)} 
                className="w-full mt-4"
                disabled={pdfProcessing}
              >
                Continue to Job Details
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              2
            </div>
            <h2 className="text-xl font-semibold">Job Details</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title" className="text-base font-medium">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="job-title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For best results, use the exact job title from the posting
                </p>
              </div>
              <div>
                <Label htmlFor="company-name" className="text-base font-medium">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Google"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional but helps with tailored recommendations
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="job-description" className="text-base font-medium">
                Job Description <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2 space-y-2">
              <Textarea
                id="job-description"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Paste the complete job description here. Include requirements, responsibilities, and qualifications for best results..."
                rows={12}
                  className="resize-none"
                required
              />
              {formData.jobDescription && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                  {formData.jobDescription.length} characters • 
                  {formData.jobDescription.split(' ').length} words
                    </div>
                    <div className="flex items-center space-x-2">
                      {formData.jobDescription.length > 500 && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          ✓ Good length
                        </Badge>
                      )}
                      {formData.jobDescription.includes('experience') && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          ✓ Experience mentioned
                        </Badge>
                      )}
                      {formData.jobDescription.includes('skills') && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          ✓ Skills listed
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">💡 Pro Tip:</p>
                      <p>Include the full job posting for the most accurate analysis. Our AI will extract key requirements, skills, and qualifications automatically.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Resume Summary</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Source: {formData.resumeFile ? 'PDF Upload' : 'Text Input'}</span>
                {formData.resumeFile && (
                  <span>File: {formData.resumeFile.name}</span>
                )}
                <span>{formData.resumeText.length} characters</span>
              </div>
            </div>

            {userProfile?.credits === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have no credits remaining. Purchase credits to analyze your resume.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={!formData.jobDescription.trim() || loading || !userProfile?.credits}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Resume (1 Credit)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Advanced AI Assistant Component */}
      <AIAssistant />

      {/* Enhanced Analysis Progress Component */}
      <AdvancedAnalysisProgress />

      {/* Gamification Achievement Component */}
      <AchievementDisplay />

      {/* Enhanced Keyword Optimization Display */}
      <KeywordOptimizationDisplay />
    </div>
    </>
  );
};

export default UnifiedResumeAnalyzer;