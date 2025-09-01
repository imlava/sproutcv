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
  ValidationError,
  SemanticAnalysisError,
  SemanticMatch,
  MissingKeyword,
  CriticalKeyword
} from '@/types/validation';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
  hash: string;
}

export class ResumeMatchValidator {
  // Add stack depth tracking to prevent infinite recursion
  private static readonly MAX_RECURSION_DEPTH = 3;
  private static readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private static instance: ResumeMatchValidator;
  private cache: Map<string, CacheEntry>;
  private recursionDepth = 0;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): ResumeMatchValidator {
    if (!ResumeMatchValidator.instance) {
      ResumeMatchValidator.instance = new ResumeMatchValidator();
    }
    return ResumeMatchValidator.instance;
  }

  // Update hash generation to be more efficient
  private generateHash(text: string): string {
    return text.slice(0, 100).split('').reduce((hash, char) => {
      return (((hash << 5) - hash) + char.charCodeAt(0)) | 0;
    }, 0).toString(36);
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < ResumeMatchValidator.CACHE_DURATION;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= ResumeMatchValidator.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
  private static readonly SEVERITY_THRESHOLDS = {
    HIGH: 0.8,    // 80% mismatch - Higher threshold for reduced false positives
    MEDIUM: 0.6,  // 60% mismatch - More balanced medium severity
    LOW: 0.4      // 40% mismatch - Higher bar for low severity warnings
  };

  private static readonly MINIMUM_TRIGGER_THRESHOLD = {
    keywordMismatch: 0.6,     // Only trigger if > 60% keywords missing
    skillsMismatch: 0.7,      // Only trigger if > 70% skills missing
    experienceMismatch: 0.7,  // Only trigger if > 70% experience mismatch
    achievementsMissing: 0.8  // Only trigger if > 80% achievements not quantified
  };

  private static readonly INDUSTRY_CONTEXT = {
    'software_engineering': {
      keywords: ['react', 'node.js', 'python', 'javascript', 'aws', 'docker', 'git', 'api', 'database'],
      skills: ['programming', 'problem-solving', 'debugging', 'testing', 'architecture'],
      metrics: ['performance', 'uptime', 'load time', 'code coverage', 'bugs fixed']
    },
    'project_management': {
      keywords: ['agile', 'scrum', 'kanban', 'jira', 'stakeholder', 'budget', 'timeline'],
      skills: ['leadership', 'communication', 'planning', 'risk management', 'team coordination'],
      metrics: ['on-time delivery', 'budget variance', 'team satisfaction', 'project success rate']
    },
    'marketing': {
      keywords: ['digital marketing', 'seo', 'analytics', 'conversion', 'brand', 'campaign'],
      skills: ['creativity', 'analytics', 'communication', 'strategic thinking'],
      metrics: ['conversion rate', 'roi', 'reach', 'engagement', 'lead generation']
    },
    'sales': {
      keywords: ['crm', 'pipeline', 'prospecting', 'closing', 'quota', 'revenue'],
      skills: ['negotiation', 'relationship building', 'communication', 'persistence'],
      metrics: ['quota attainment', 'deal size', 'conversion rate', 'pipeline velocity']
    }
  };

  async validateMatch(resumeText: string, jobDescription: string, userId?: string): Promise<ValidationResult> {
    try {
      if (this.recursionDepth >= ResumeMatchValidator.MAX_RECURSION_DEPTH) {
        throw new Error('Maximum recursion depth exceeded');
      }
      this.recursionDepth++;

      // Generate cache key
      const resumeHash = this.generateHash(resumeText);
      const jobHash = this.generateHash(jobDescription);
      const cacheKey = `${resumeHash}:${jobHash}`;

      // Check cache
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        console.log('Using cached validation result');
        this.recursionDepth--;
        return cachedEntry.result;
      }

      console.log('Starting resume validation...');
      
      const analysis = await this.performDeepAnalysis(resumeText, jobDescription);
      const significantWarnings = this.filterSignificantWarnings(analysis);
      const confidence = this.calculateOverallConfidence(analysis);

      const result: ValidationResult = {
        hasSignificantMismatch: significantWarnings.length > 0,
        warnings: significantWarnings,
        details: analysis,
        confidence
      };

      // Store in cache
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        hash: cacheKey
      });

      // Clean old cache entries
      this.cleanCache();

      // Log validation results for monitoring
      if (userId) {
        await this.logValidationResults(userId, result).catch(error => {
          console.error('Failed to log validation results:', error);
        });
      }

      this.recursionDepth--;
      return result;
    } catch (error) {
      this.recursionDepth = 0; // Reset on error
      console.error('Validation error:', error);
      throw new ValidationError('Failed to validate resume match', 'VALIDATION_FAILED', error);
    }
  }

  private async performDeepAnalysis(resumeText: string, jobDescription: string): Promise<DetailedAnalysisReport> {
    console.log('Performing deep analysis...');

    const [
      keywordAnalysis,
      skillsAnalysis, 
      experienceAnalysis,
      achievementsAnalysis,
      industryAnalysis,
      atsAnalysis
    ] = await Promise.all([
      this.analyzeKeywords(resumeText, jobDescription),
      this.analyzeSkills(resumeText, jobDescription),
      this.analyzeExperience(resumeText, jobDescription),
      this.analyzeAchievements(resumeText),
      this.analyzeIndustryAlignment(resumeText, jobDescription),
      this.analyzeATSCompatibility(resumeText)
    ]);

    return {
      keywords: keywordAnalysis,
      skills: skillsAnalysis,
      experience: experienceAnalysis,
      achievements: achievementsAnalysis,
      industryAlignment: industryAnalysis,
      atsCompatibility: atsAnalysis
    };
  }

  private async analyzeKeywords(resumeText: string, jobDescription: string): Promise<KeywordAnalysisResult> {
    // Use NLP for better keyword extraction
    const nlp = await import('compromise');
    const natural = await import('natural');
    const tokenizer = new natural.WordTokenizer();
    const TfIdf = natural.TfIdf;
    
    // Initialize TF-IDF
    const tfidf = new TfIdf();
    tfidf.addDocument(jobDescription);
    tfidf.addDocument(resumeText);
    
    // Extract noun phrases and technical terms
    const jobDoc = nlp.default(jobDescription);
    const resumeDoc = nlp.default(resumeText);
    
    // Get noun phrases
    const jobPhrases = jobDoc.match('#Noun+').out('array');
    const resumePhrases = resumeDoc.match('#Noun+').out('array');
    
    // Get technical terms
    const jobTech = jobDoc.match('#Technical+').out('array');
    const resumeTech = resumeDoc.match('#Technical+').out('array');
    
    // Combine and filter unique terms
    const jobKeywords = [...new Set([...jobPhrases, ...jobTech])];
    const resumeKeywords = [...new Set([...resumePhrases, ...resumeTech])];
    
    // Use TF-IDF to identify important terms
    const importantTerms = new Set<string>();
    tfidf.listTerms(0 /* jobDescription */).forEach(item => {
      if (item.tfidf > 5) { // Threshold for importance
        importantTerms.add(item.term);
      }
    });
    
    // Enhanced semantic matching
    const semanticMatches = await this.findSemanticMatches(
      resumeKeywords,
      jobKeywords
    );
    
    // Calculate scores with context
    const matchScore = this.calculateKeywordMatchScore(
      jobKeywords,
      semanticMatches
    );
    
    const missingKeywords = this.identifyMissingKeywords(
      jobKeywords,
      resumeKeywords,
      semanticMatches
    );
    
    const criticalKeywords = this.identifyCriticalKeywords(
      jobKeywords,
      semanticMatches
    );
    
    const keywordDensity = this.calculateKeywordDensity(
      resumeText,
      jobKeywords
    );
    
    const contextualRelevance = this.calculateContextualRelevance(
      resumeText,
      jobDescription
    );

    return {
      missingKeywords,
      matchScore,
      criticalKeywords,
      semanticMatches,
      keywordDensity,
      contextualRelevance,
      
    };
  }

  private extractJobKeywords(jobDescription: string): string[] {
    const text = jobDescription.toLowerCase();
    const keywords = new Set<string>();

    // Extract technical skills
    const techPatterns = [
      /\b(react|angular|vue|node\.?js|python|java|javascript|typescript)\b/g,
      /\b(aws|azure|gcp|docker|kubernetes|git|jenkins)\b/g,
      /\b(sql|mongodb|redis|postgresql|mysql)\b/g,
      /\b(api|rest|graphql|microservices)\b/g
    ];

    techPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => keywords.add(match));
    });

    // Extract industry terms
    const industryPatterns = [
      /\b(agile|scrum|kanban|devops|ci\/cd)\b/g,
      /\b(project management|product management|team lead)\b/g,
      /\b(analytics|optimization|performance|scalability)\b/g
    ];

    industryPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => keywords.add(match));
    });

    // Extract requirements keywords
    const requirementSection = this.extractRequirementsSection(text);
    const requirementKeywords = this.extractKeywordsFromSection(requirementSection);
    requirementKeywords.forEach(keyword => keywords.add(keyword));

    return Array.from(keywords).filter(k => k.length > 2);
  }

  private extractRequirementsSection(text: string): string {
    const sections = text.split(/(?:requirements?|qualifications?|skills?|experience):/i);
    return sections.length > 1 ? sections[1].split(/(?:responsibilities?|duties?):/i)[0] : text;
  }

  private extractKeywordsFromSection(text: string): string[] {
    // Extract bullet points and key phrases
    const bullets = text.match(/[•\-\*]\s*(.+?)(?=\n|$)/g) || [];
    const phrases = bullets.map(bullet => bullet.replace(/[•\-\*]\s*/, '').trim());
    
    const keywords = new Set<string>();
    phrases.forEach(phrase => {
      const words = phrase.toLowerCase().match(/\b\w{3,}\b/g) || [];
      words.forEach(word => {
        if (!this.isCommonWord(word)) {
          keywords.add(word);
        }
      });
    });

    return Array.from(keywords);
  }

  private extractResumeKeywords(resumeText: string): string[] {
    const text = resumeText.toLowerCase();
    const keywords = new Set<string>();

    // Extract from different resume sections
    const sections = {
      skills: this.extractSkillsSection(text),
      experience: this.extractExperienceSection(text),
      achievements: this.extractAchievementsSection(text)
    };

    Object.values(sections).forEach(section => {
      const sectionKeywords = this.extractKeywordsFromSection(section);
      sectionKeywords.forEach(keyword => keywords.add(keyword));
    });

    return Array.from(keywords);
  }

  private extractSkillsSection(text: string): string {
    const skillsMatch = text.match(/(?:skills?|technologies?|tools?):(.*?)(?:\n\n|\n[A-Z]|$)/is);
    return skillsMatch ? skillsMatch[1] : '';
  }

  private extractExperienceSection(text: string): string {
    const expMatch = text.match(/(?:experience|employment|work history):(.*?)(?:\n\n[A-Z]|education|$)/is);
    return expMatch ? expMatch[1] : '';
  }

  private extractAchievementsSection(text: string): string {
    const achMatch = text.match(/(?:achievements?|accomplishments?):(.*?)(?:\n\n[A-Z]|$)/is);
    return achMatch ? achMatch[1] : text; // Fall back to full text for achievements
  }

  private findSemanticMatches(resumeKeywords: string[], jobKeywords: string[]): SemanticMatch[] {
    const matches: SemanticMatch[] = [];

    jobKeywords.forEach(jobKeyword => {
      resumeKeywords.forEach(resumeKeyword => {
        const similarity = this.calculateSemanticSimilarity(jobKeyword, resumeKeyword);
        if (similarity > 0.8) { // High threshold for semantic similarity
          matches.push({
            jobKeyword,
            resumeKeyword,
            similarity,
            context: this.getKeywordContext(resumeKeyword)
          });
        }
      });
    });

    return matches;
  }

  private calculateSemanticSimilarity(word1: string, word2: string): number {
    // Simple semantic similarity - can be enhanced with actual embeddings
    if (word1 === word2) return 1.0;
    
    // Check for synonyms and related terms
    const synonyms: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript', 'node'],
      'python': ['py', 'django', 'flask'],
      'leadership': ['lead', 'manage', 'direct', 'supervise'],
      'management': ['manage', 'oversee', 'coordinate', 'supervise']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((key === word1 && values.includes(word2)) || 
          (key === word2 && values.includes(word1)) ||
          (values.includes(word1) && values.includes(word2))) {
        return 0.9;
      }
    }

    // Levenshtein distance similarity
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,        // deletion
          matrix[j - 1][i] + 1,        // insertion
          matrix[j - 1][i - 1] + indicator   // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getKeywordContext(keyword: string): string {
    // Return context category for the keyword
    const contexts = {
      'technical': ['react', 'python', 'javascript', 'sql', 'aws', 'docker'],
      'leadership': ['manage', 'lead', 'supervise', 'coordinate', 'direct'],
      'analytics': ['analysis', 'data', 'metrics', 'reporting', 'insights']
    };

    for (const [context, keywords] of Object.entries(contexts)) {
      if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
        return context;
      }
    }

    return 'general';
  }

  private identifyMissingKeywords(jobKeywords: string[], resumeKeywords: string[], semanticMatches: SemanticMatch[]): MissingKeyword[] {
    const matchedJobKeywords = new Set(semanticMatches.map(m => m.jobKeyword));
    const missing = jobKeywords.filter(keyword => !matchedJobKeywords.has(keyword));

    return missing.map(keyword => ({
      keyword,
      importance: this.calculateKeywordImportance(keyword),
      category: this.categorizeKeyword(keyword),
      alternatives: this.suggestAlternatives(keyword),
      contexts: this.getKeywordContexts(keyword)
    }));
  }

  private calculateKeywordImportance(keyword: string): number {
    // Critical technical skills get highest importance
    const criticalTech = ['react', 'python', 'javascript', 'aws', 'sql'];
    if (criticalTech.includes(keyword.toLowerCase())) return 0.9;

    // Important soft skills
    const importantSoft = ['leadership', 'communication', 'teamwork'];
    if (importantSoft.includes(keyword.toLowerCase())) return 0.7;

    // Industry terms
    const industryTerms = ['agile', 'scrum', 'api', 'database'];
    if (industryTerms.includes(keyword.toLowerCase())) return 0.6;

    return 0.4; // Default importance
  }

  private categorizeKeyword(keyword: string): string {
    const categories = {
      'technical': ['react', 'python', 'javascript', 'sql', 'aws', 'docker', 'git'],
      'methodology': ['agile', 'scrum', 'kanban', 'devops', 'ci/cd'],
      'soft_skill': ['leadership', 'communication', 'teamwork', 'problem-solving'],
      'domain': ['healthcare', 'finance', 'e-commerce', 'saas', 'enterprise']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => keyword.toLowerCase().includes(k) || k.includes(keyword.toLowerCase()))) {
        return category;
      }
    }

    return 'general';
  }

  private suggestAlternatives(keyword: string): string[] {
    const alternatives: Record<string, string[]> = {
      'javascript': ['JS', 'ECMAScript', 'Node.js', 'TypeScript'],
      'python': ['Django', 'Flask', 'NumPy', 'Pandas'],
      'leadership': ['team management', 'team lead', 'mentoring', 'coaching'],
      'agile': ['Scrum', 'Kanban', 'sprint planning', 'iterative development']
    };

    return alternatives[keyword.toLowerCase()] || [];
  }

  private getKeywordContexts(keyword: string): string[] {
    return [this.getKeywordContext(keyword)];
  }

  private identifyCriticalKeywords(jobKeywords: string[], semanticMatches: SemanticMatch[]): CriticalKeyword[] {
    const keywordFrequency = this.calculateKeywordFrequency(jobKeywords);
    
    return jobKeywords
      .filter(keyword => keywordFrequency[keyword] > 1 || this.calculateKeywordImportance(keyword) > 0.7)
      .map(keyword => ({
        keyword,
        criticality: this.calculateKeywordImportance(keyword),
        frequency: keywordFrequency[keyword] || 1,
        alternatives: this.suggestAlternatives(keyword)
      }));
  }

  private calculateKeywordFrequency(keywords: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });
    return frequency;
  }

  private calculateKeywordMatchScore(jobKeywords: string[], semanticMatches: SemanticMatch[]): number {
    if (jobKeywords.length === 0) return 1.0;
    
    const uniqueMatches = new Set(semanticMatches.map(m => m.jobKeyword));
    const weightedScore = semanticMatches.reduce((sum, match) => sum + match.similarity, 0);
    
    return Math.min(weightedScore / jobKeywords.length, 1.0);
  }

  private calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.toLowerCase().split(/\s+/);
    const keywordCount = keywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    return words.length > 0 ? keywordCount / words.length : 0;
  }

  private calculateContextualRelevance(resumeText: string, jobDescription: string): number {
    // Simple relevance calculation based on common domain terms
    const resumeWords = new Set(resumeText.toLowerCase().split(/\s+/));
    const jobWords = new Set(jobDescription.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...resumeWords].filter(word => jobWords.has(word)));
    const union = new Set([...resumeWords, ...jobWords]);
    
    return intersection.size / union.size;
  }

  private async analyzeSkills(resumeText: string, jobDescription: string): Promise<SkillsAnalysisResult> {
    // Implementation for skills analysis
    return {
      missingCriticalSkills: [],
      skillMatchScore: 0.8,
      industryAlignment: 0.7,
      skillCategories: [],
      levelMismatch: []
    };
  }

  private async analyzeExperience(resumeText: string, jobDescription: string): Promise<ExperienceAnalysisResult> {
    // Implementation for experience analysis
    return {
      yearsGap: 0,
      roleAlignment: 0.8,
      industryAlignment: 0.7,
      seniorityMismatch: {
        required: 'senior',
        present: 'mid',
        confidence: 0.8,
        indicators: []
      },
      relevantExperiencePercentage: 0.8
    };
  }

  private async analyzeAchievements(resumeText: string): Promise<AchievementsAnalysisResult> {
    // Implementation for achievements analysis
    return {
      quantifiedAchievements: [],
      qualitativeAchievements: [],
      achievementScore: 0.6,
      missingMetrics: [],
      improvementOpportunities: []
    };
  }

  private async analyzeIndustryAlignment(resumeText: string, jobDescription: string): Promise<IndustryAlignmentResult> {
    // Implementation for industry alignment
    return {
      detectedIndustry: 'technology',
      targetIndustry: 'technology',
      alignmentScore: 0.9,
      transferableSkills: [],
      industryGaps: []
    };
  }

  private async analyzeATSCompatibility(resumeText: string): Promise<ATSCompatibilityResult> {
    const issues: ATSIssue[] = [];
    let formatScore = 100;
    let contentScore = 100;
    
    // Check for common ATS formatting issues
    const formattingChecks = [
      {
        check: (text: string) => text.includes('│') || text.includes('─') || text.includes('┌') || text.includes('┐'),
        penalty: 15,
        issue: 'Tables or complex formatting detected - may cause parsing issues'
      },
      {
        check: (text: string) => text.match(/\s{5,}/g) !== null,
        penalty: 10,
        issue: 'Excessive spacing detected - may affect parsing'
      },
      {
        check: (text: string) => text.match(/[^\x00-\x7F]/g) !== null,
        penalty: 10,
        issue: 'Non-standard characters detected - may cause compatibility issues'
      },
      {
        check: (text: string) => text.match(/\[.*?\]/g) !== null,
        penalty: 5,
        issue: 'Square brackets detected - may affect parsing'
      }
    ];

    // Apply formatting checks
    formattingChecks.forEach(({ check, penalty, issue }) => {
      if (check(resumeText)) {
        formatScore -= penalty;
        issues.push({ type: 'format', severity: 'MEDIUM', description: issue, solution: 'Convert complex formatting to simple text.' });
      }
    });

    // Check for required sections
    const requiredSections = [
      { name: 'contact information', pattern: /(?:email|phone|address):/i },
      { name: 'experience', pattern: /(?:experience|employment|work history):/i },
      { name: 'education', pattern: /education:/i },
      { name: 'skills', pattern: /(?:skills|expertise|competencies):/i }
    ];

    const missingSections = requiredSections.filter(
      section => !section.pattern.test(resumeText)
    );

    if (missingSections.length > 0) {
      contentScore -= (missingSections.length * 10);
      issues.push({ type: 'content', severity: 'MEDIUM', description: `Missing standard sections: ${missingSections.map(s => s.name).join(', ')}`, solution: 'Add missing sections with clear headings.' });
    }

    // Check contact information format
    const contactChecks = [
      {
        type: 'email',
        pattern: /[\w.-]+@[\w.-]+\.\w+/,
        penalty: 10,
        issue: 'Email address not found or in incorrect format'
      },
      {
        type: 'phone',
        pattern: /(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/,
        penalty: 5,
        issue: 'Phone number not found or in incorrect format'
      }
    ];

    contactChecks.forEach(({ pattern, penalty, issue }) => {
      if (!pattern.test(resumeText)) {
        contentScore -= penalty;
        issues.push({ type: 'content', severity: 'LOW', description: issue, solution: 'Ensure email and phone are present and correctly formatted.' });
      }
    });

    // Check for proper date formatting
    const dateCheck = resumeText.match(/(?:19|20)\d{2}(?:\s*[-–]\s*(?:present|current|now|\d{4})?)?/gi);
    if (!dateCheck) {
      contentScore -= 10;
      issues.push({ type: 'content', severity: 'LOW', description: 'Dates not found or in incorrect format', solution: 'Use clear date ranges like 2021–2024 or 2021-2024.' });
    }

    // Check bullet point consistency
    const bulletPoints = resumeText.match(/[•\-\*]\s+/g);
    if (!bulletPoints || bulletPoints.length < 3) {
      contentScore -= 5;
      issues.push({ type: 'content', severity: 'LOW', description: 'Limited or inconsistent use of bullet points', solution: 'Use consistent bullet points to list achievements and responsibilities.' });
    }

    // Generate recommendations based on issues
    const recommendations = issues.map(issue => {
      const desc = issue.description;
      switch (true) {
        case desc.includes('Tables'):
          return 'Convert tables to bullet points or simple text format';
        case desc.includes('spacing'):
          return 'Use consistent single spacing and standard margins';
        case desc.includes('characters'):
          return 'Replace special characters with standard ASCII alternatives';
        case desc.includes('sections'):
          return 'Add all standard resume sections with clear headings';
        case desc.includes('bullet points'):
          return 'Use consistent bullet points to list achievements and responsibilities';
        case desc.includes('Email'):
          return 'Add a properly formatted email address';
        case desc.includes('Phone'):
          return 'Add a properly formatted phone number';
        case desc.includes('Dates'):
          return 'Use clear date ranges in YYYY-YYYY format';
        default:
          return 'Review and fix formatting issues for better ATS compatibility';
      }
    });

    // Normalize scores
    formatScore = Math.max(Math.min(formatScore, 100), 0);
    contentScore = Math.max(Math.min(contentScore, 100), 0);

    // Calculate overall score with weighted average
    const score = (formatScore * 0.4 + contentScore * 0.6) / 100;

    return {
      score,
      issues,
      recommendations,
      formatScore: formatScore / 100,
      contentScore: contentScore / 100
    };
  }

  private filterSignificantWarnings(analysis: DetailedAnalysisReport): Warning[] {
    const warnings: Warning[] = [];

    // Keyword mismatch warning
    if (analysis.keywords.matchScore < ResumeMatchValidator.MINIMUM_TRIGGER_THRESHOLD.keywordMismatch) {
      warnings.push(this.createKeywordWarning(analysis.keywords));
    }

    // Skills gap warning
    if (analysis.skills.skillMatchScore < ResumeMatchValidator.MINIMUM_TRIGGER_THRESHOLD.skillsMismatch) {
      warnings.push(this.createSkillsWarning(analysis.skills));
    }

    // Experience mismatch warning
    if (analysis.experience.roleAlignment < ResumeMatchValidator.MINIMUM_TRIGGER_THRESHOLD.experienceMismatch) {
      warnings.push(this.createExperienceWarning(analysis.experience));
    }

    // Achievements warning
    if (analysis.achievements.achievementScore < ResumeMatchValidator.MINIMUM_TRIGGER_THRESHOLD.achievementsMissing) {
      warnings.push(this.createAchievementsWarning(analysis.achievements));
    }

    return warnings.filter(warning => warning.criticalityScore > 0.5);
  }

  private createKeywordWarning(keywordAnalysis: KeywordAnalysisResult): Warning {
    const severity = this.calculateSeverity(keywordAnalysis.matchScore);
    const criticalityScore = 1 - keywordAnalysis.matchScore;

    return {
      id: 'keyword_mismatch',
      type: 'keyword_mismatch',
      severity,
      title: 'Significant Keyword Gap Detected',
      description: `Your resume is missing ${keywordAnalysis.missingKeywords.length} important keywords that appear in the job description.`,
      explanation: 'Keywords are crucial for passing ATS systems and showing relevant experience. Missing key terms can significantly reduce your chances of getting interviews.',
      importance: 'High - ATS systems rely heavily on keyword matching to filter candidates.',
      actions: [
        { id: 'SHOW_KEYWORDS', label: 'Show Missing Keywords', type: 'primary', icon: 'Eye' },
        { id: 'AI_OPTIMIZE', label: 'AI Optimize', type: 'secondary', icon: 'Zap' },
        { id: 'DISMISS', label: 'Dismiss', type: 'destructive', icon: 'X' }
      ],
      solutions: [
        'Review the job description and incorporate relevant missing keywords naturally',
        'Update your skills section to include technical terms mentioned in the job posting',
        'Rewrite experience bullet points to include industry-specific terminology',
        'Add a summary section that highlights key qualifications using job-relevant language'
      ],
      examples: [
        {
          before: 'Worked on web applications using modern frameworks',
          after: 'Developed React-based web applications using Node.js and implemented RESTful APIs',
          context: 'Adding specific technical keywords'
        },
        {
          before: 'Managed team projects successfully',
          after: 'Led agile development teams using Scrum methodology to deliver projects on time',
          context: 'Including methodology keywords'
        }
      ],
      dismissible: true,
      criticalityScore
    };
  }

  private createSkillsWarning(skillsAnalysis: SkillsAnalysisResult): Warning {
    const severity = this.calculateSeverity(skillsAnalysis.skillMatchScore);
    
    return {
      id: 'skills_gap',
      type: 'skills_gap',
      severity,
      title: 'Critical Skills Gap Identified',
      description: `Your resume doesn't demonstrate several key skills required for this role.`,
      explanation: 'Employers look for specific skill sets. Missing critical skills can indicate you may not be qualified for the position.',
      importance: 'High - Skills directly impact your ability to perform the job effectively.',
      actions: [
        { id: 'SHOW_SKILLS', label: 'Show Missing Skills', type: 'primary' },
        { id: 'SKILL_SUGGESTIONS', label: 'Get Suggestions', type: 'secondary' }
      ],
      solutions: [
        'Add a dedicated skills section highlighting relevant technical and soft skills',
        'Incorporate skill demonstrations into your experience descriptions',
        'Consider adding certifications or training that validate your skills'
      ],
      examples: [],
      dismissible: true,
      criticalityScore: 1 - skillsAnalysis.skillMatchScore
    };
  }

  private createExperienceWarning(experienceAnalysis: ExperienceAnalysisResult): Warning {
    const severity = this.calculateSeverity(experienceAnalysis.roleAlignment);
    
    return {
      id: 'experience_mismatch',
      type: 'experience_mismatch', 
      severity,
      title: 'Experience Alignment Issue',
      description: 'Your experience may not clearly align with the role requirements.',
      explanation: 'Employers want to see relevant experience that demonstrates your ability to succeed in the role.',
      importance: 'Medium - Experience relevance is important but can sometimes be addressed through skill demonstration.',
      actions: [
        { id: 'REFRAME_EXPERIENCE', label: 'Reframe Experience', type: 'primary' },
        { id: 'HIGHLIGHT_TRANSFERABLE', label: 'Show Transferable Skills', type: 'secondary' }
      ],
      solutions: [
        'Reframe your experience to highlight transferable skills',
        'Focus on achievements that demonstrate relevant capabilities',
        'Use the job description language to describe your past roles'
      ],
      examples: [],
      dismissible: true,
      criticalityScore: 1 - experienceAnalysis.roleAlignment
    };
  }

  private createAchievementsWarning(achievementsAnalysis: AchievementsAnalysisResult): Warning {
    const severity = this.calculateSeverity(achievementsAnalysis.achievementScore);
    
    return {
      id: 'achievements_missing',
      type: 'achievements_missing',
      severity,
      title: 'Weak Achievement Statements',
      description: 'Your resume lacks quantified achievements that demonstrate impact.',
      explanation: 'Quantified achievements show employers the concrete value you can bring to their organization.',
      importance: 'High - Achievements are often the deciding factor between similar candidates.',
      actions: [
        { id: 'ADD_METRICS', label: 'Add Metrics', type: 'primary' },
        { id: 'ACHIEVEMENT_EXAMPLES', label: 'See Examples', type: 'secondary' }
      ],
      solutions: [
        'Add specific numbers, percentages, and metrics to your accomplishments',
        'Use the STAR method (Situation, Task, Action, Result) for experience descriptions',
        'Include before/after comparisons to show improvement'
      ],
      examples: [
        {
          before: 'Improved team productivity',
          after: 'Improved team productivity by 35% through implementation of agile methodologies, reducing project delivery time from 8 to 5 weeks',
          context: 'Adding specific metrics and methods'
        }
      ],
      dismissible: true,
      criticalityScore: 1 - achievementsAnalysis.achievementScore
    };
  }

  private calculateSeverity(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score < ResumeMatchValidator.SEVERITY_THRESHOLDS.HIGH) return 'HIGH';
    if (score < ResumeMatchValidator.SEVERITY_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  private calculateOverallConfidence(analysis: DetailedAnalysisReport): number {
    const scores = [
      analysis.keywords.matchScore,
      analysis.skills.skillMatchScore,
      analysis.experience.roleAlignment,
      analysis.achievements.achievementScore,
      analysis.industryAlignment.alignmentScore,
      analysis.atsCompatibility.score
    ];

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
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
    }
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'toward', 'towards', 'upon', 'across', 'behind', 'beneath', 'beside', 'beyond', 'inside', 'outside', 'under', 'over'];
    return commonWords.includes(word.toLowerCase());
  }
}