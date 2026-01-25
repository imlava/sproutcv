/**
 * Real Resume Tailor Component
 * Allows users to tailor their actual resume content for a specific job
 * Replaces mock data with real user content
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { unifiedAIService } from '@/services/ai/UnifiedAIService';
import { 
  Edit3, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Target,
  Brain,
  BarChart3,
  Award,
  Sparkles,
  Save,
  Undo2,
  Copy,
  Download,
  Loader2
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeSection {
  id: string;
  name: string;
  original: string;
  current: string;
  isModified: boolean;
  suggestions: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

interface RealResumeTailorProps {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  analysisResult?: any;
  onSave?: (tailoredResume: string) => void;
  onExport?: (tailoredResume: string, format: 'txt' | 'docx' | 'pdf') => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse resume text into sections
 */
function parseResumeIntoSections(resumeText: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  
  // Common section headers (case-insensitive)
  const sectionPatterns = [
    { name: 'Summary', patterns: ['summary', 'objective', 'profile', 'about'] },
    { name: 'Experience', patterns: ['experience', 'work experience', 'employment', 'work history'] },
    { name: 'Education', patterns: ['education', 'academic', 'qualifications'] },
    { name: 'Skills', patterns: ['skills', 'technical skills', 'competencies', 'technologies'] },
    { name: 'Projects', patterns: ['projects', 'portfolio', 'work samples'] },
    { name: 'Certifications', patterns: ['certifications', 'certificates', 'licenses'] },
  ];

  // Try to split by section headers
  let remainingText = resumeText;
  let lastIndex = 0;

  for (const { name, patterns } of sectionPatterns) {
    const regex = new RegExp(`(?:^|\\n)\\s*(${patterns.join('|')})\\s*[:\\n]`, 'im');
    const match = remainingText.match(regex);
    
    if (match && match.index !== undefined) {
      // Find the end of this section (start of next section or end of text)
      const sectionStart = match.index + match[0].length;
      let sectionEnd = remainingText.length;
      
      // Look for the next section header
      for (const { patterns: nextPatterns } of sectionPatterns) {
        const nextRegex = new RegExp(`(?:^|\\n)\\s*(${nextPatterns.join('|')})\\s*[:\\n]`, 'im');
        const nextMatch = remainingText.substring(sectionStart).match(nextRegex);
        if (nextMatch && nextMatch.index !== undefined) {
          const potentialEnd = sectionStart + nextMatch.index;
          if (potentialEnd < sectionEnd && potentialEnd > sectionStart) {
            sectionEnd = potentialEnd;
          }
        }
      }
      
      const sectionContent = remainingText.substring(sectionStart, sectionEnd).trim();
      
      if (sectionContent.length > 10) { // Only add non-empty sections
        sections.push({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          original: sectionContent,
          current: sectionContent,
          isModified: false,
          suggestions: [],
          matchedKeywords: [],
          missingKeywords: [],
        });
      }
    }
  }

  // If no sections found, create a single "Full Resume" section
  if (sections.length === 0) {
    sections.push({
      id: 'full-resume',
      name: 'Full Resume',
      original: resumeText,
      current: resumeText,
      isModified: false,
      suggestions: [],
      matchedKeywords: [],
      missingKeywords: [],
    });
  }

  return sections;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

// ============================================================================
// COMPONENT
// ============================================================================

const RealResumeTailor: React.FC<RealResumeTailorProps> = ({
  resumeText,
  jobDescription,
  jobTitle = 'Position',
  companyName = 'Company',
  analysisResult,
  onSave,
  onExport,
}) => {
  const { toast } = useToast();
  
  // State
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [processingSection, setProcessingSection] = useState<string | null>(null);
  const [keywordStats, setKeywordStats] = useState<{
    matched: string[];
    missing: string[];
    density: number;
  }>({ matched: [], missing: [], density: 0 });

  // Initialize sections from resume text
  useEffect(() => {
    if (resumeText) {
      const parsedSections = parseResumeIntoSections(resumeText);
      setSections(parsedSections);
      if (parsedSections.length > 0) {
        setSelectedSectionId(parsedSections[0].id);
      }
      
      // Analyze keywords
      analyzeKeywords(parsedSections);
    }
  }, [resumeText]);

  // Analyze keywords across all sections
  const analyzeKeywords = useCallback((sectionsToAnalyze: ResumeSection[]) => {
    const jobKeywords = extractKeywords(jobDescription);
    const resumeContent = sectionsToAnalyze.map(s => s.current).join(' ');
    const resumeKeywords = extractKeywords(resumeContent);
    
    const matched = [...new Set(jobKeywords.filter(k => resumeKeywords.includes(k)))];
    const missing = [...new Set(jobKeywords.filter(k => !resumeKeywords.includes(k)))].slice(0, 15);
    
    setKeywordStats({
      matched,
      missing,
      density: matched.length / Math.max(jobKeywords.length, 1),
    });

    // Update each section with its keyword analysis
    setSections(prev => prev.map(section => {
      const sectionKeywords = extractKeywords(section.current);
      return {
        ...section,
        matchedKeywords: jobKeywords.filter(k => sectionKeywords.includes(k)),
        missingKeywords: jobKeywords.filter(k => !sectionKeywords.includes(k)).slice(0, 5),
      };
    }));
  }, [jobDescription]);

  // Handle section content change
  const handleSectionChange = useCallback((sectionId: string, newContent: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, current: newContent, isModified: newContent !== section.original }
        : section
    ));
  }, []);

  // AI-powered section rewrite
  const handleAIRewrite = useCallback(async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setProcessingSection(sectionId);
    setProcessing(true);

    try {
      const rewrittenContent = await unifiedAIService.rewriteSection({
        sectionName: section.name,
        sectionContent: section.current,
        jobDescription,
        jobTitle,
        targetKeywords: keywordStats.missing.slice(0, 10),
        tone: 'professional',
      });

      if (rewrittenContent && rewrittenContent !== section.current) {
        handleSectionChange(sectionId, rewrittenContent);
        analyzeKeywords(sections.map(s => 
          s.id === sectionId ? { ...s, current: rewrittenContent } : s
        ));
        
        toast({
          title: "Section Optimized",
          description: `${section.name} has been enhanced for the ${jobTitle} position.`,
        });
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize section. Please try again or edit manually.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProcessingSection(null);
    }
  }, [sections, jobDescription, jobTitle, keywordStats.missing, handleSectionChange, analyzeKeywords, toast]);

  // Reset section to original
  const handleResetSection = useCallback((sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, current: section.original, isModified: false }
        : section
    ));
    analyzeKeywords(sections);
    toast({
      title: "Section Reset",
      description: "Content has been restored to the original.",
    });
  }, [sections, analyzeKeywords, toast]);

  // Generate full tailored resume
  const handleGenerateTailored = useCallback(async () => {
    setProcessing(true);
    
    try {
      const result = await unifiedAIService.tailorResume({
        resumeText: sections.map(s => `${s.name}:\n${s.current}`).join('\n\n'),
        jobDescription,
        jobTitle,
        companyName,
      });

      if (result.tailoredResume) {
        // Parse the tailored resume back into sections
        const newSections = parseResumeIntoSections(result.tailoredResume);
        setSections(newSections);
        analyzeKeywords(newSections);
        
        toast({
          title: "Resume Tailored!",
          description: `Your resume has been optimized for ${jobTitle} at ${companyName}.`,
        });
      }
    } catch (error) {
      console.error('Tailoring error:', error);
      toast({
        title: "Tailoring Failed",
        description: "Unable to generate tailored resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [sections, jobDescription, jobTitle, companyName, analyzeKeywords, toast]);

  // Copy full resume to clipboard
  const handleCopyResume = useCallback(() => {
    const fullResume = sections.map(s => `${s.name}:\n${s.current}`).join('\n\n');
    navigator.clipboard.writeText(fullResume);
    toast({
      title: "Copied!",
      description: "Tailored resume copied to clipboard.",
    });
  }, [sections, toast]);

  // Save resume
  const handleSave = useCallback(() => {
    const fullResume = sections.map(s => `${s.name}:\n${s.current}`).join('\n\n');
    if (onSave) {
      onSave(fullResume);
    }
    toast({
      title: "Saved!",
      description: "Your tailored resume has been saved.",
    });
  }, [sections, onSave, toast]);

  // Export resume
  const handleExport = useCallback((format: 'txt' | 'docx' | 'pdf') => {
    const fullResume = sections.map(s => `${s.name}:\n${s.current}`).join('\n\n');
    
    if (format === 'txt') {
      // Simple text download
      const blob = new Blob([fullResume], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tailored-resume-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: "Resume exported as text file.",
      });
    } else if (onExport) {
      onExport(fullResume, format);
    }
  }, [sections, jobTitle, onExport, toast]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const modifiedCount = sections.filter(s => s.isModified).length;
  const keywordMatchPercentage = Math.round(keywordStats.density * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tailor Your Resume</h2>
          <p className="text-gray-600">
            Optimizing for <span className="font-semibold">{jobTitle}</span> at{' '}
            <span className="font-semibold">{companyName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyResume}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={() => handleExport('txt')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onSave && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{keywordMatchPercentage}%</div>
          <div className="text-sm text-gray-600">Keyword Match</div>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{keywordStats.matched.length}</div>
          <div className="text-sm text-gray-600">Keywords Found</div>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{keywordStats.missing.length}</div>
          <div className="text-sm text-gray-600">Keywords Missing</div>
        </Card>
        <Card className="p-4 text-center">
          <Edit3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{modifiedCount}</div>
          <div className="text-sm text-gray-600">Sections Modified</div>
        </Card>
      </div>

      {/* AI Tailor Button */}
      <Button 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
        onClick={handleGenerateTailored}
        disabled={processing}
      >
        {processing && !processingSection ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating Tailored Resume...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            AI: Tailor Entire Resume for This Job
          </>
        )}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Editor */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Tabs value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {sections.map(section => (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="flex items-center gap-1"
                  >
                    {section.name}
                    {section.isModified && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map(section => (
                <TabsContent key={section.id} value={section.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">{section.name}</Label>
                    <div className="flex gap-2">
                      {section.isModified && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleResetSection(section.id)}
                        >
                          <Undo2 className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAIRewrite(section.id)}
                        disabled={processing}
                      >
                        {processingSection === section.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-1" />
                            AI Optimize
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea 
                    value={section.current}
                    onChange={(e) => handleSectionChange(section.id, e.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                    placeholder={`Enter your ${section.name.toLowerCase()} content...`}
                  />

                  {/* Section suggestions */}
                  {section.missingKeywords.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Suggested Keywords to Add
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {section.missingKeywords.map((keyword, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-orange-100"
                            onClick={() => {
                              handleSectionChange(section.id, section.current + ` ${keyword}`);
                            }}
                          >
                            + {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Matched Keywords */}
          <Card className="p-4">
            <h3 className="font-semibold text-green-700 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Matched Keywords ({keywordStats.matched.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywordStats.matched.slice(0, 20).map((keyword, idx) => (
                <Badge key={idx} className="bg-green-100 text-green-800 border-green-200">
                  {keyword}
                </Badge>
              ))}
              {keywordStats.matched.length > 20 && (
                <Badge variant="outline">+{keywordStats.matched.length - 20} more</Badge>
              )}
            </div>
          </Card>

          {/* Missing Keywords */}
          <Card className="p-4">
            <h3 className="font-semibold text-orange-700 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Missing Keywords ({keywordStats.missing.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywordStats.missing.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="border-orange-200 text-orange-700">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Optimization Tips
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Click "AI Optimize" to automatically enhance each section</li>
              <li>• Click on missing keywords to add them to your resume</li>
              <li>• Quantify achievements with specific numbers</li>
              <li>• Mirror the language used in the job description</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RealResumeTailor;
