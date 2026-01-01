// Enhanced AI Resume Analyzer Component with Gemini Integration
import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { 
  Brain, 
  FileText, 
  BarChart3, 
  Target, 
  Zap, 
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Award,
  Code,
  Briefcase
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const AIResumeAnalyzer = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  // Pre-fill with sample data
  useEffect(() => {
    setResumeText(`JOHN SMITH
Senior Software Engineer
Email: john.smith@email.com | Phone: (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Senior Software Engineer with 8+ years developing scalable web applications using React, Node.js, and Python. Led cross-functional teams of 5+ developers and delivered 20+ successful projects. Expertise in cloud architecture, microservices, and agile methodologies.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
• Led development of customer-facing web application serving 100K+ daily users
• Reduced system response time by 40% through performance optimization
• Mentored 3 junior developers and established code review processes
• Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes

Software Engineer | StartupXYZ | 2018 - 2020
• Built RESTful APIs handling 10M+ requests daily
• Collaborated with product team to deliver 15+ features ahead of schedule
• Reduced bug reports by 60% through comprehensive testing strategies
• Worked with React, Node.js, PostgreSQL, and AWS services

Junior Developer | WebSolutions | 2016 - 2018
• Developed responsive websites for 25+ clients
• Learned and applied modern JavaScript frameworks
• Participated in agile development processes

EDUCATION
Bachelor of Science in Computer Science | State University | 2016

SKILLS
Languages: JavaScript, Python, TypeScript, Java
Frameworks: React, Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jenkins, JIRA, Slack`);

    setJobDescription(`SENIOR FULL STACK DEVELOPER
Company: InnovateNow Inc.
Location: San Francisco, CA (Remote OK)

ROLE OVERVIEW:
We're seeking a Senior Full Stack Developer to join our fast-growing fintech startup. You'll be responsible for building scalable web applications, leading technical initiatives, and mentoring junior developers.

REQUIREMENTS:
• 5+ years experience in full-stack development
• Strong proficiency in React, Node.js, and TypeScript
• Experience with cloud platforms (AWS preferred)
• Knowledge of microservices architecture and API design
• Experience with PostgreSQL and NoSQL databases
• Familiarity with DevOps practices (CI/CD, Docker, Kubernetes)
• Strong problem-solving skills and attention to detail
• Experience working in agile/scrum environments
• Bachelor's degree in Computer Science or related field

PREFERRED QUALIFICATIONS:
• Experience in fintech or financial services
• Knowledge of GraphQL and modern state management
• Experience with testing frameworks (Jest, Cypress)
• Leadership experience and ability to mentor junior developers
• Open source contributions

RESPONSIBILITIES:
• Design and develop scalable web applications
• Lead technical architecture decisions
• Mentor and guide junior developers
• Collaborate with product and design teams
• Implement best practices for code quality and security
• Participate in code reviews and technical discussions

BENEFITS:
• Competitive salary: $140K - $180K
• Equity package
• Health, dental, vision insurance
• Remote work flexibility
• Learning and development budget`);

    setJobTitle('Senior Full Stack Developer');
    setCompanyName('InnovateNow Inc.');
  }, []);

  // Generate comprehensive AI analysis using Gemini
  const generateAIAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      let prompt = '';
      
      if (analysisType === 'comprehensive') {
        prompt = `
As an expert AI resume analyzer with 50+ years of experience in talent acquisition and career development, perform a comprehensive analysis of this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Please provide a detailed JSON analysis with the following structure:

{
  "overall_score": number (0-100),
  "ats_score": number (0-100),
  "match_percentage": number (0-100),
  "strengths": [
    {
      "category": "Technical Skills" | "Experience" | "Leadership" | "Education" | "Achievements",
      "description": "detailed strength description",
      "impact": "High" | "Medium" | "Low",
      "relevance_score": number (0-100)
    }
  ],
  "areas_for_improvement": [
    {
      "category": "Technical Skills" | "Experience" | "Education" | "Certifications" | "Keywords",
      "description": "specific improvement needed",
      "priority": "High" | "Medium" | "Low",
      "suggested_action": "actionable recommendation"
    }
  ],
  "keyword_analysis": {
    "matched_keywords": ["array of matched keywords"],
    "missing_keywords": ["array of missing critical keywords"],
    "keyword_density": number (0-100),
    "optimization_suggestions": ["array of keyword optimization tips"]
  },
  "experience_analysis": {
    "years_experience": number,
    "relevance_score": number (0-100),
    "leadership_experience": boolean,
    "industry_alignment": number (0-100),
    "progression_score": number (0-100)
  },
  "technical_skills_analysis": {
    "programming_languages": {
      "matched": ["languages"],
      "missing": ["languages"],
      "proficiency_assessment": "Expert" | "Advanced" | "Intermediate" | "Beginner"
    },
    "frameworks_tools": {
      "matched": ["frameworks/tools"],
      "missing": ["frameworks/tools"],
      "modern_stack_score": number (0-100)
    },
    "cloud_devops": {
      "matched": ["cloud/devops skills"],
      "missing": ["cloud/devops skills"],
      "maturity_score": number (0-100)
    }
  },
  "ats_optimization": {
    "formatting_score": number (0-100),
    "keyword_placement": number (0-100),
    "section_structure": number (0-100),
    "improvements": ["array of ATS improvements"]
  },
  "recommendations": {
    "immediate_actions": ["array of immediate improvements"],
    "short_term_goals": ["array of 3-6 month goals"],
    "long_term_development": ["array of 6+ month goals"],
    "additional_skills": ["array of skills to learn"]
  },
  "salary_insights": {
    "estimated_range": "salary range based on experience",
    "negotiation_points": ["array of negotiation strengths"],
    "market_positioning": "description of market position"
  },
  "interview_preparation": {
    "likely_questions": ["array of interview questions"],
    "story_opportunities": ["array of STAR method opportunities"],
    "technical_prep": ["array of technical preparation areas"]
  },
  "cultural_fit": {
    "company_alignment": number (0-100),
    "role_alignment": number (0-100),
    "growth_potential": number (0-100),
    "red_flags": ["array of potential concerns"]
  }
}

Provide only the JSON response, no additional text.`;
      } else if (analysisType === 'quick') {
        prompt = `
Perform a quick analysis of this resume against the job description. Focus on key match points and immediate improvements.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a JSON response with:
{
  "overall_score": number (0-100),
  "match_percentage": number (0-100),
  "top_strengths": ["array of top 3 strengths"],
  "immediate_improvements": ["array of top 3 improvements"],
  "missing_keywords": ["array of critical missing keywords"],
  "quick_wins": ["array of easy improvements"]
}`;
      } else if (analysisType === 'ats') {
        prompt = `
Perform an ATS-focused analysis of this resume for the given job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a JSON response with:
{
  "ats_score": number (0-100),
  "keyword_match": number (0-100),
  "formatting_score": number (0-100),
  "matched_keywords": ["array"],
  "missing_critical_keywords": ["array"],
  "formatting_issues": ["array"],
  "ats_optimization_tips": ["array"]
}`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        
        // Store analysis in database
        await storeAnalysis(analysisData);
        
        setAnalysis(analysisData);
        setActiveTab('analysis');
      } else {
        throw new Error('Invalid response format from AI');
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Store analysis in Supabase
  const storeAnalysis = async (analysisData) => {
    try {
      const { data, error } = await supabase
        .from('enhanced_analyses')
        .insert({
          user_id: 'demo-user', // Replace with actual user ID
          document_type: 'resume',
          analysis_type: analysisType,
          overall_score: analysisData.overall_score || analysisData.ats_score,
          match_percentage: analysisData.match_percentage,
          analysis_data: analysisData,
          job_title: jobTitle,
          company_name: companyName
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store analysis:', error);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
Create a compelling cover letter based on this resume and job description:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Write a professional cover letter that:
1. Highlights the most relevant experience
2. Addresses key job requirements
3. Shows enthusiasm for the role and company
4. Uses specific examples from the resume
5. Is 3-4 paragraphs long
6. Has a professional but engaging tone

Format as a complete cover letter with proper greeting and closing.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const coverLetter = response.text();
      
      // You could open this in a modal or new tab
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>Generated Cover Letter</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
            <h1>Cover Letter for ${jobTitle}</h1>
            <div style="white-space: pre-wrap; line-height: 1.6;">${coverLetter}</div>
          </body>
        </html>
      `);
      
    } catch (error) {
      setError('Failed to generate cover letter: ' + error.message);
    }
  };

  // Generate tailored resume
  const generateTailoredResume = async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
Based on this resume and job description, create an optimized version that's tailored for this specific role:

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Please rewrite the resume to:
1. Emphasize relevant experience and skills
2. Include job-specific keywords naturally
3. Reorder sections for maximum impact
4. Quantify achievements where possible
5. Align language with job requirements
6. Maintain truthfulness while optimizing presentation

Provide the complete tailored resume in a professional format.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const tailoredResume = response.text();
      
      // Open in new window
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>Tailored Resume</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
            <h1>Tailored Resume for ${jobTitle}</h1>
            <div style="white-space: pre-wrap; line-height: 1.6;">${tailoredResume}</div>
          </body>
        </html>
      `);
      
    } catch (error) {
      setError('Failed to generate tailored resume: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Resume Analyzer
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Advanced AI-powered resume analysis with Gemini integration
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'input', label: '📝 Input', icon: FileText },
            { id: 'analysis', label: '📊 Analysis', icon: BarChart3 },
            { id: 'results', label: '📋 Results', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Analysis Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Resume Input */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Resume Text *
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Job Description Input */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Job Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Tech Company Inc."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Analysis Options */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Options</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  id: 'comprehensive',
                  title: '🧠 Comprehensive Analysis',
                  description: 'Deep dive analysis with detailed insights',
                  icon: Brain
                },
                {
                  id: 'quick',
                  title: '⚡ Quick Analysis',
                  description: 'Fast overview with key points',
                  icon: Zap
                },
                {
                  id: 'ats',
                  title: '🎯 ATS Focus Analysis',
                  description: 'Focus on ATS optimization',
                  icon: Target
                }
              ].map(option => (
                <div
                  key={option.id}
                  onClick={() => setAnalysisType(option.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    analysisType === option.id
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <option.icon className="h-5 w-5" />
                    <h4 className="font-medium">{option.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={generateAIAnalysis}
              disabled={isAnalyzing || !resumeText || !jobDescription}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Analyze Resume
                </>
              )}
            </button>

            <button
              onClick={generateCoverLetter}
              disabled={!resumeText || !jobDescription}
              className="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-5 w-5" />
              Generate Cover Letter
            </button>

            <button
              onClick={generateTailoredResume}
              disabled={!resumeText || !jobDescription}
              className="flex items-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              Generate Tailored Resume
            </button>
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-6">
          {/* Overall Scores */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Overall Score</h3>
              </div>
              <div className="text-3xl font-bold">
                {analysis.overall_score || analysis.ats_score}%
              </div>
            </div>

            {analysis.match_percentage && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Job Match</h3>
                </div>
                <div className="text-3xl font-bold">{analysis.match_percentage}%</div>
              </div>
            )}

            {analysis.ats_score && (
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">ATS Score</h3>
                </div>
                <div className="text-3xl font-bold">{analysis.ats_score}%</div>
              </div>
            )}
          </div>

          {/* Comprehensive Analysis Sections */}
          {analysisType === 'comprehensive' && (
            <>
              {/* Strengths */}
              {analysis.strengths && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Key Strengths
                  </h3>
                  <div className="space-y-4">
                    {analysis.strengths.map((strength, index) => (
                      <div key={index} className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-800">{strength.category}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            strength.impact === 'High' ? 'bg-green-100 text-green-800' :
                            strength.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {strength.impact} Impact
                          </span>
                        </div>
                        <p className="text-gray-700">{strength.description}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{width: `${strength.relevance_score}%`}}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 mt-1">
                            Relevance: {strength.relevance_score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {analysis.areas_for_improvement && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-orange-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-4">
                    {analysis.areas_for_improvement.map((area, index) => (
                      <div key={index} className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-orange-800">{area.category}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            area.priority === 'High' ? 'bg-red-100 text-red-800' :
                            area.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {area.priority} Priority
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{area.description}</p>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Suggestion:</strong> {area.suggested_action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Skills Analysis */}
              {analysis.technical_skills_analysis && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Code className="h-6 w-6" />
                    Technical Skills Analysis
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Programming Languages */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Programming Languages</h4>
                      {analysis.technical_skills_analysis.programming_languages.matched.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-600 mb-1">Matched:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.technical_skills_analysis.programming_languages.matched.map((lang, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.technical_skills_analysis.programming_languages.missing.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">Missing:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.technical_skills_analysis.programming_languages.missing.map((lang, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Frameworks & Tools */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Frameworks & Tools</h4>
                      {analysis.technical_skills_analysis.frameworks_tools.matched.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-600 mb-1">Matched:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.technical_skills_analysis.frameworks_tools.matched.map((tool, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          Modern Stack Score: {analysis.technical_skills_analysis.frameworks_tools.modern_stack_score}%
                        </p>
                      </div>
                    </div>

                    {/* Cloud & DevOps */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Cloud & DevOps</h4>
                      {analysis.technical_skills_analysis.cloud_devops.matched.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-600 mb-1">Matched:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.technical_skills_analysis.cloud_devops.matched.map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          Maturity Score: {analysis.technical_skills_analysis.cloud_devops.maturity_score}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Analysis Results */}
          {analysisType === 'quick' && (
            <div className="space-y-6">
              {/* Top Strengths */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Top Strengths</h3>
                <ul className="space-y-2">
                  {analysis.top_strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Immediate Improvements */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">Immediate Improvements</h3>
                <ul className="space-y-2">
                  {analysis.immediate_improvements?.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Wins */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Quick Wins</h3>
                <ul className="space-y-2">
                  {analysis.quick_wins?.map((win, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ATS Analysis Results */}
          {analysisType === 'ats' && (
            <div className="space-y-6">
              {/* ATS Scores */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-2">Keyword Match</h4>
                  <div className="text-2xl font-bold text-blue-600">{analysis.keyword_match}%</div>
                </div>
                <div className="bg-white border rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-2">Formatting Score</h4>
                  <div className="text-2xl font-bold text-green-600">{analysis.formatting_score}%</div>
                </div>
                <div className="bg-white border rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-2">Overall ATS Score</h4>
                  <div className="text-2xl font-bold text-purple-600">{analysis.ats_score}%</div>
                </div>
              </div>

              {/* Keywords Analysis */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Keywords Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-800 mb-3">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matched_keywords?.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 mb-3">Missing Critical Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missing_critical_keywords?.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ATS Optimization Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">ATS Optimization Tips</h3>
                <ul className="space-y-2">
                  {analysis.ats_optimization_tips?.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && analysis && (
        <div className="space-y-6">
          {/* Action Items */}
          {analysis.recommendations && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                Actionable Recommendations
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Immediate Actions</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.immediate_actions?.map((action, index) => (
                      <li key={index} className="text-sm opacity-90">• {action}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Short-term Goals</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.short_term_goals?.map((goal, index) => (
                      <li key={index} className="text-sm opacity-90">• {goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Long-term Development</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.long_term_development?.map((dev, index) => (
                      <li key={index} className="text-sm opacity-90">• {dev}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Interview Preparation */}
          {analysis.interview_preparation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Interview Preparation
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Likely Questions</h4>
                  <ul className="space-y-1">
                    {analysis.interview_preparation.likely_questions?.map((question, index) => (
                      <li key={index} className="text-sm text-gray-700">• {question}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">STAR Method Opportunities</h4>
                  <ul className="space-y-1">
                    {analysis.interview_preparation.story_opportunities?.map((story, index) => (
                      <li key={index} className="text-sm text-gray-700">• {story}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Salary Insights */}
          {analysis.salary_insights && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Salary & Negotiation Insights
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-800">Estimated Range</h4>
                  <p className="text-gray-700">{analysis.salary_insights.estimated_range}</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Market Positioning</h4>
                  <p className="text-gray-700">{analysis.salary_insights.market_positioning}</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Negotiation Points</h4>
                  <ul className="space-y-1">
                    {analysis.salary_insights.negotiation_points?.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700">• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              <Download className="h-5 w-5" />
              Export Analysis
            </button>
            <button 
              onClick={() => {
                navigator.share && navigator.share({
                  title: 'Resume Analysis Results',
                  text: `My resume scored ${analysis.overall_score || analysis.ats_score}% for ${jobTitle}`,
                });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Share2 className="h-5 w-5" />
              Share Results
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Resume...</h3>
            <p className="text-gray-600 mb-4">Our AI is performing a deep analysis of your resume</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResumeAnalyzer;
