import React, { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, Clock, FileText, Search, Settings, TrendingUp, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface EnhancedAnalysisResult {
  analysisId: string
  overallScore: number
  confidence: number
  processingMetadata: {
    analysisVersion: string
    processingTime: number
    featuresUsed: string[]
    documentQuality: 'excellent' | 'good' | 'fair' | 'poor'
  }
  atsCompatibility: {
    score: number
    systemsCompatible: string[]
    formatIssues: string[]
    recommendations: string[]
  }
  keywordAnalysis: {
    matchScore: number
    foundKeywords: string[]
    missingKeywords: string[]
    relevanceScores: Record<string, number>
    semanticMatches: string[]
  }
  skillsAnalysis: {
    technicalSkills: {
      identified: string[]
      proficiencyLevels: Record<string, string>
      relevanceToJob: Record<string, number>
    }
    softSkills: {
      identified: string[]
      contextualEvidence: Record<string, string>
    }
    gapAnalysis: {
      missing: string[]
      emerging: string[]
      recommendations: string[]
    }
  }
  experienceAnalysis: {
    relevanceScore: number
    careerProgression: string
    industryAlignment: number
    achievements: {
      quantified: string[]
      qualitative: string[]
      impact: string[]
    }
    gaps: string[]
  }
  enhancementSuggestions: {
    critical: string[]
    important: string[]
    recommended: string[]
    contentOptimization: {
      addSections: string[]
      improveSections: string[]
      removeSections: string[]
    }
    formatting: string[]
  }
  industryInsights: {
    industryTrends: string[]
    salaryInsights: {
      expectedRange: string
      factors: string[]
    }
    competitiveAnalysis: string
    growthPotential: string
  }
}

interface EnhancedResumeAnalyzerProps {
  resumeText: string
  jobDescription: string
  onAnalysisComplete?: (result: EnhancedAnalysisResult) => void
}

export function EnhancedResumeAnalyzer({ 
  resumeText, 
  jobDescription, 
  onAnalysisComplete 
}: EnhancedResumeAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<EnhancedAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  
  const supabase = useSupabaseClient()
  const user = useUser()

  const performEnhancedAnalysis = useCallback(async () => {
    if (!resumeText || !jobDescription || !user) {
      toast.error('Please provide both resume and job description')
      return
    }

    setIsAnalyzing(true)
    setProgress(0)
    setProcessingStep('Initializing enhanced AI analysis...')

    try {
      // Step 1: Document Processing
      setProcessingStep('Processing documents with Document AI...')
      setProgress(20)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Vector Embeddings
      setProcessingStep('Generating semantic embeddings with Vertex AI...')
      setProgress(40)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 3: AI Analysis
      setProcessingStep('Performing comprehensive AI analysis...')
      setProgress(60)

      const { data, error } = await supabase.functions.invoke('enhanced-gemini-analyzer', {
        body: {
          action: 'analyze',
          resumeText,
          jobDescription,
          userId: user.id,
          options: {
            enableAdvancedFeatures: true,
            includeIndustryInsights: true,
            detailedSkillsAnalysis: true
          }
        }
      })

      if (error) throw error

      setProcessingStep('Finalizing results...')
      setProgress(80)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(100)
      setAnalysisResult(data)
      onAnalysisComplete?.(data)
      
      toast.success('Enhanced analysis completed successfully!')
      
    } catch (error) {
      console.error('Enhanced analysis error:', error)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
      setProcessingStep('')
    }
  }, [resumeText, jobDescription, user, supabase, onAnalysisComplete])

  useEffect(() => {
    if (resumeText && jobDescription && user) {
      performEnhancedAnalysis()
    }
  }, [performEnhancedAnalysis])

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Enhanced AI Analysis in Progress
          </CardTitle>
          <CardDescription>
            Using advanced Document AI, Vertex embeddings, and enhanced analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{processingStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Document AI</div>
              <div className="text-xs text-gray-600">Processing</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Search className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">Vector Embeddings</div>
              <div className="text-xs text-gray-600">Vertex AI</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">AI Analysis</div>
              <div className="text-xs text-gray-600">Enhanced Gemini</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-sm font-medium">Optimization</div>
              <div className="text-xs text-gray-600">ATS Compatible</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysisResult) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Waiting for analysis...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Enhanced Overview Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Enhanced Analysis Complete
            </span>
            <Badge variant="outline" className="text-xs">
              v{analysisResult.processingMetadata.analysisVersion}
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced AI analysis with Document AI, Vertex embeddings, and industry insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{analysisResult.overallScore}</div>
              <div className="text-sm text-blue-800">Overall Score</div>
              <div className="text-xs text-blue-600">
                {analysisResult.confidence * 100}% confidence
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{analysisResult.atsCompatibility.score}</div>
              <div className="text-sm text-green-800">ATS Score</div>
              <div className="text-xs text-green-600">
                {analysisResult.atsCompatibility.systemsCompatible.length} systems
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{analysisResult.keywordAnalysis.matchScore}</div>
              <div className="text-sm text-purple-800">Keyword Match</div>
              <div className="text-xs text-purple-600">
                {analysisResult.keywordAnalysis.foundKeywords.length} found
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{analysisResult.experienceAnalysis.relevanceScore}</div>
              <div className="text-sm text-orange-800">Experience</div>
              <div className="text-xs text-orange-600">
                {analysisResult.experienceAnalysis.industryAlignment}% aligned
              </div>
            </div>
          </div>

          {/* Processing Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm font-medium mb-2">Processing Details</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="font-medium">Document Quality</div>
                <Badge variant={
                  analysisResult.processingMetadata.documentQuality === 'excellent' ? 'default' :
                  analysisResult.processingMetadata.documentQuality === 'good' ? 'secondary' :
                  'destructive'
                }>
                  {analysisResult.processingMetadata.documentQuality}
                </Badge>
              </div>
              <div>
                <div className="font-medium">Processing Time</div>
                <div>{analysisResult.processingMetadata.processingTime}ms</div>
              </div>
              <div>
                <div className="font-medium">Features Used</div>
                <div>{analysisResult.processingMetadata.featuresUsed.join(', ')}</div>
              </div>
              <div>
                <div className="font-medium">Analysis ID</div>
                <div className="font-mono">{analysisResult.analysisId.slice(-8)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ats">ATS</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EnhancementSuggestionsCard suggestions={analysisResult.enhancementSuggestions} />
        </TabsContent>

        <TabsContent value="ats" className="space-y-4">
          <ATSCompatibilityCard atsData={analysisResult.atsCompatibility} />
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <KeywordAnalysisCard keywordData={analysisResult.keywordAnalysis} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillsAnalysisCard skillsData={analysisResult.skillsAnalysis} />
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <ExperienceAnalysisCard experienceData={analysisResult.experienceAnalysis} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <IndustryInsightsCard insightsData={analysisResult.industryInsights} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Enhanced component cards for detailed analysis display
function EnhancementSuggestionsCard({ suggestions }: { suggestions: EnhancedAnalysisResult['enhancementSuggestions'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestions.critical.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            Important Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestions.important.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recommended Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestions.recommended.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function ATSCompatibilityCard({ atsData }: { atsData: EnhancedAnalysisResult['atsCompatibility'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ATS Compatibility Analysis</CardTitle>
        <CardDescription>
          Compatibility with major Applicant Tracking Systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>ATS Compatibility Score</span>
          <div className="flex items-center gap-2">
            <Progress value={atsData.score} className="w-24" />
            <span className="font-bold">{atsData.score}%</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Compatible Systems</h4>
          <div className="flex flex-wrap gap-2">
            {atsData.systemsCompatible.map((system, index) => (
              <Badge key={index} variant="secondary">{system}</Badge>
            ))}
          </div>
        </div>

        {atsData.formatIssues.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Format Issues</h4>
            <ul className="space-y-1">
              {atsData.formatIssues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {atsData.recommendations.map((rec, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function KeywordAnalysisCard({ keywordData }: { keywordData: EnhancedAnalysisResult['keywordAnalysis'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Keyword Match Analysis</CardTitle>
          <CardDescription>
            Semantic and exact keyword matching with relevance scoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Overall Keyword Match</span>
            <div className="flex items-center gap-2">
              <Progress value={keywordData.matchScore} className="w-24" />
              <span className="font-bold">{keywordData.matchScore}%</span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Found Keywords ({keywordData.foundKeywords.length})</h4>
            <div className="flex flex-wrap gap-2">
              {keywordData.foundKeywords.map((keyword, index) => (
                <Badge key={index} variant="default">{keyword}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Missing Keywords ({keywordData.missingKeywords.length})</h4>
            <div className="flex flex-wrap gap-2">
              {keywordData.missingKeywords.map((keyword, index) => (
                <Badge key={index} variant="destructive">{keyword}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Semantic Matches ({keywordData.semanticMatches.length})</h4>
            <div className="flex flex-wrap gap-2">
              {keywordData.semanticMatches.map((match, index) => (
                <Badge key={index} variant="secondary">{match}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SkillsAnalysisCard({ skillsData }: { skillsData: EnhancedAnalysisResult['skillsAnalysis'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Technical Skills Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Identified Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skillsData.technicalSkills.identified.map((skill, index) => (
                <Badge key={index} variant="default">{skill}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Skills Gap Analysis</h4>
            <ul className="space-y-2">
              {skillsData.gapAnalysis.missing.map((skill, index) => (
                <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Missing: {skill}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Emerging Skills to Consider</h4>
            <div className="flex flex-wrap gap-2">
              {skillsData.gapAnalysis.emerging.map((skill, index) => (
                <Badge key={index} variant="outline">{skill}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Soft Skills Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h4 className="font-medium mb-2">Identified Soft Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skillsData.softSkills.identified.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExperienceAnalysisCard({ experienceData }: { experienceData: EnhancedAnalysisResult['experienceAnalysis'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Relevance Score</div>
            <div className="text-2xl font-bold">{experienceData.relevanceScore}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Industry Alignment</div>
            <div className="text-2xl font-bold">{experienceData.industryAlignment}%</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Career Progression</h4>
          <p className="text-sm text-gray-700">{experienceData.careerProgression}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Quantified Achievements</h4>
          <ul className="space-y-1">
            {experienceData.achievements.quantified.map((achievement, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                {achievement}
              </li>
            ))}
          </ul>
        </div>

        {experienceData.gaps.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Experience Gaps</h4>
            <ul className="space-y-1">
              {experienceData.gaps.map((gap, index) => (
                <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function IndustryInsightsCard({ insightsData }: { insightsData: EnhancedAnalysisResult['industryInsights'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Industry Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insightsData.industryTrends.map((trend, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                {trend}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Salary Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Expected Range</div>
            <div className="text-lg font-semibold">{insightsData.salaryInsights.expectedRange}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Factors Affecting Salary</div>
            <ul className="space-y-1">
              {insightsData.salaryInsights.factors.map((factor, index) => (
                <li key={index} className="text-sm">{factor}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{insightsData.competitiveAnalysis}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Growth Potential</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{insightsData.growthPotential}</p>
        </CardContent>
      </Card>
    </div>
  )
}
