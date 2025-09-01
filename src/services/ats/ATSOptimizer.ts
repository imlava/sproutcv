import { 
  ATSCompatibility, 
  FormattingScore, 
  StructureScore, 
  ContentScore, 
  ATSIssue 
} from '@/types/analysis';

export class ATSOptimizer {
  private readonly atsRules = {
    formatting: [
      { check: this.hasComplexFormatting.bind(this), weight: 0.3, name: 'Complex Formatting' },
      { check: this.hasProperHeadings.bind(this), weight: 0.2, name: 'Proper Headings' },
      { check: this.hasCleanStructure.bind(this), weight: 0.5, name: 'Clean Structure' }
    ],
    structure: [
      { check: this.hasContactInfo.bind(this), weight: 0.3, name: 'Contact Information' },
      { check: this.hasExperience.bind(this), weight: 0.4, name: 'Required Sections' },
      { check: this.hasLogicalFlow.bind(this), weight: 0.3, name: 'Logical Flow' }
    ],
    content: [
      { check: this.hasProperKeywords.bind(this), weight: 0.4, name: 'Keyword Usage' },
      { check: this.hasQuantifiedAchievements.bind(this), weight: 0.3, name: 'Quantified Achievements' },
      { check: this.hasActionVerbs.bind(this), weight: 0.3, name: 'Action Verbs' }
    ]
  };

  async checkCompatibility(resumeText: string): Promise<ATSCompatibility> {
    const formattingScore = await this.checkFormatting(resumeText);
    const structureScore = await this.checkStructure(resumeText);
    const contentScore = await this.checkContent(resumeText);
    const issues = await this.identifyIssues(resumeText);

    const overallScore = this.calculateOverallScore(formattingScore, structureScore, contentScore);

    return {
      score: overallScore,
      formatting: formattingScore,
      structure: structureScore,
      content: contentScore,
      issues
    };
  }

  private async checkFormatting(resumeText: string): Promise<FormattingScore> {
    const checks = {
      hasSimpleFormatting: !this.hasComplexFormatting(resumeText),
      hasProperHeadings: this.hasProperHeadings(resumeText),
      hasCleanStructure: this.hasCleanStructure(resumeText),
      hasReadableFonts: true // Assume true for text-based analysis
    };

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;

    return {
      score: Math.round(score),
      ...checks
    };
  }

  private async checkStructure(resumeText: string): Promise<StructureScore> {
    const checks = {
      hasContactInfo: this.hasContactInfo(resumeText),
      hasSummary: this.hasSummary(resumeText),
      hasExperience: this.hasExperience(resumeText),
      hasEducation: this.hasEducation(resumeText),
      hasSkills: this.hasSkills(resumeText)
    };

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;

    return {
      score: Math.round(score),
      ...checks
    };
  }

  private async checkContent(resumeText: string): Promise<ContentScore> {
    const keywordDensity = this.calculateKeywordDensity(resumeText);
    const hasRelevantContent = keywordDensity > 0.02; // At least 2% keyword density
    const hasActionVerbs = this.hasActionVerbs(resumeText);
    const hasQuantifiedAchievements = this.hasQuantifiedAchievements(resumeText);

    const checks = [hasRelevantContent, hasActionVerbs, hasQuantifiedAchievements];
    const score = checks.filter(Boolean).length / checks.length * 100;

    return {
      score: Math.round(score),
      keywordDensity: Math.round(keywordDensity * 1000) / 10, // Convert to percentage with 1 decimal
      relevantContent: hasRelevantContent,
      actionVerbs: hasActionVerbs,
      quantifiedAchievements: hasQuantifiedAchievements
    };
  }

  private async identifyIssues(resumeText: string): Promise<ATSIssue[]> {
    const issues: ATSIssue[] = [];

    // Check for complex formatting
    if (this.hasComplexFormatting(resumeText)) {
      issues.push({
        type: 'warning',
        category: 'formatting',
        message: 'Complex formatting detected',
        solution: 'Use simple, clean formatting without tables, graphics, or unusual fonts'
      });
    }

    // Check for missing contact info
    if (!this.hasContactInfo(resumeText)) {
      issues.push({
        type: 'critical',
        category: 'structure',
        message: 'Missing contact information',
        solution: 'Add your name, phone number, email, and location at the top of your resume'
      });
    }

    // Check for missing sections
    if (!this.hasExperience(resumeText)) {
      issues.push({
        type: 'critical',
        category: 'structure',
        message: 'Missing work experience section',
        solution: 'Add a work experience or professional experience section'
      });
    }

    // Check for low keyword density
    if (this.calculateKeywordDensity(resumeText) < 0.02) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Low keyword density',
        solution: 'Include more relevant keywords from the job description'
      });
    }

    // Check for lack of quantified achievements
    if (!this.hasQuantifiedAchievements(resumeText)) {
      issues.push({
        type: 'suggestion',
        category: 'content',
        message: 'No quantified achievements found',
        solution: 'Add specific numbers, percentages, or metrics to demonstrate your impact'
      });
    }

    return issues;
  }

  private calculateOverallScore(
    formatting: FormattingScore, 
    structure: StructureScore, 
    content: ContentScore
  ): number {
    const weights = { formatting: 0.3, structure: 0.4, content: 0.3 };
    
    return Math.round(
      formatting.score * weights.formatting +
      structure.score * weights.structure +
      content.score * weights.content
    );
  }

  // Formatting checks
  private hasComplexFormatting(text: string): boolean {
    // Check for indicators of complex formatting that might confuse ATS
    const complexPatterns = [
      /\|{2,}/, // Table-like structures
      /[─━═]{3,}/, // Horizontal lines
      /[│┃║]{2,}/, // Vertical lines
      /[◆◇●○■□▲△]/g, // Special bullets
    ];

    return complexPatterns.some(pattern => pattern.test(text));
  }

  private hasProperHeadings(text: string): boolean {
    const headingPatterns = [
      /(?:^|\n)\s*(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)/i,
      /(?:^|\n)\s*(EDUCATION)/i,
      /(?:^|\n)\s*(SKILLS)/i,
      /(?:^|\n)\s*(SUMMARY|OBJECTIVE|PROFILE)/i
    ];

    return headingPatterns.some(pattern => pattern.test(text));
  }

  private hasCleanStructure(text: string): boolean {
    // Check for consistent spacing and structure
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim());
    
    // Should have reasonable line length variation (not all lines same length)
    const lengths = nonEmptyLines.map(line => line.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    return variance > 100; // Some variation in line lengths indicates structure
  }

  // Structure checks
  private hasContactInfo(text: string): boolean {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}/;
    
    return emailPattern.test(text) || phonePattern.test(text);
  }

  private hasSummary(text: string): boolean {
    const summaryPatterns = [
      /(?:^|\n)\s*(SUMMARY|OBJECTIVE|PROFILE|ABOUT)/i
    ];

    return summaryPatterns.some(pattern => pattern.test(text));
  }

  private hasExperience(text: string): boolean {
    const experiencePatterns = [
      /(?:^|\n)\s*(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT)/i,
      /\b(Software Engineer|Developer|Manager|Analyst|Coordinator|Specialist)\b/i,
      /\b(20\d{2})\s*[-–—]\s*(20\d{2}|Present|Current)\b/i
    ];

    return experiencePatterns.some(pattern => pattern.test(text));
  }

  private hasEducation(text: string): boolean {
    const educationPatterns = [
      /(?:^|\n)\s*(EDUCATION|ACADEMIC)/i,
      /\b(Bachelor|Master|PhD|Associate|Diploma|Certificate)\b/i,
      /\b(University|College|Institute|School)\b/i
    ];

    return educationPatterns.some(pattern => pattern.test(text));
  }

  private hasSkills(text: string): boolean {
    const skillsPatterns = [
      /(?:^|\n)\s*(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)/i,
      /\b(JavaScript|Python|Java|React|Angular|Vue|Node|SQL|AWS|Azure)\b/i
    ];

    return skillsPatterns.some(pattern => pattern.test(text));
  }

  private hasLogicalFlow(text: string): boolean {
    // Check if experience section appears before education (typical format)
    const experienceIndex = text.search(/EXPERIENCE|WORK EXPERIENCE/i);
    const educationIndex = text.search(/EDUCATION/i);
    
    return experienceIndex !== -1 && educationIndex !== -1 && experienceIndex < educationIndex;
  }

  // Content checks
  private hasProperKeywords(text: string): boolean {
    // This would be enhanced to check against job-specific keywords
    const commonKeywords = [
      'managed', 'developed', 'implemented', 'designed', 'created',
      'led', 'optimized', 'improved', 'analyzed', 'collaborated'
    ];

    const keywordCount = commonKeywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);

    return keywordCount >= 3;
  }

  private hasActionVerbs(text: string): boolean {
    const actionVerbs = [
      'achieved', 'managed', 'led', 'developed', 'implemented', 'designed',
      'created', 'improved', 'increased', 'decreased', 'optimized',
      'streamlined', 'coordinated', 'collaborated', 'analyzed'
    ];

    return actionVerbs.some(verb => 
      new RegExp(`\\b${verb}`, 'i').test(text)
    );
  }

  private hasQuantifiedAchievements(text: string): boolean {
    const quantifierPatterns = [
      /\b\d+%/, // Percentages
      /\$\d+/, // Dollar amounts
      /\b\d+\s*(million|thousand|k|m)\b/i, // Large numbers
      /\b(increased|decreased|improved|reduced).*\d+/i, // Quantified improvements
      /\b\d+\s*(projects|clients|team|people|users|customers)/i // Quantities
    ];

    return quantifierPatterns.some(pattern => pattern.test(text));
  }

  private calculateKeywordDensity(text: string): number {
    // Simple keyword density calculation
    // In production, this would be more sophisticated
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    const keywords = [
      'software', 'development', 'programming', 'engineering',
      'management', 'analysis', 'design', 'implementation'
    ];

    const keywordCount = words.reduce((count, word) => {
      return count + (keywords.includes(word) ? 1 : 0);
    }, 0);

    return keywordCount / totalWords;
  }

  // Public utility methods
  getOptimizationTips(): string[] {
    return [
      'Use simple, clean formatting without tables or graphics',
      'Include relevant keywords from the job description',
      'Use standard section headings (Experience, Education, Skills)',
      'Add quantifiable achievements with specific numbers',
      'Start bullet points with action verbs',
      'Keep consistent formatting throughout',
      'Save as PDF to preserve formatting',
      'Use standard fonts like Arial or Helvetica'
    ];
  }

  getCommonATSIssues(): { issue: string; solution: string }[] {
    return [
      {
        issue: 'Complex formatting with tables and graphics',
        solution: 'Use simple text formatting with clear sections'
      },
      {
        issue: 'Missing standard section headings',
        solution: 'Use headings like "Experience", "Education", "Skills"'
      },
      {
        issue: 'Low keyword density',
        solution: 'Include relevant keywords from job descriptions'
      },
      {
        issue: 'Lack of quantified achievements',
        solution: 'Add specific numbers and metrics to show impact'
      },
      {
        issue: 'Unusual file formats',
        solution: 'Submit as PDF or Word document'
      }
    ];
  }
}