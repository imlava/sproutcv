
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Download, 
  CheckCircle, 
  Target,
  Zap,
  TrendingUp,
  Clock,
  User,
  CreditCard,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Star,
  AlertTriangle,
  Sprout,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Github,
  Linkedin,
  Briefcase,
  Building
} from 'lucide-react';

const AnimatedDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const demoSteps = [
    {
      id: 'dashboard',
      title: 'Welcome Dashboard',
      description: 'User logs into their SproutCV dashboard',
      content: (
        <div className="bg-gray-50 min-h-[500px] rounded-xl overflow-hidden">
          {/* Real Dashboard Header */}
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
                  <Sprout className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">SproutCV</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">12 credits</span>
                </div>
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Sarah! 👋</h2>
              <p className="text-gray-600 text-lg">Ready to optimize your resume for your next dream job?</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">8</h3>
                    <p className="text-green-700 font-medium">Resumes Analyzed</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">87%</h3>
                    <p className="text-blue-700 font-medium">Avg. Score</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">5</h3>
                    <p className="text-purple-700 font-medium">Interviews</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Analyses</h3>
                <div className="space-y-3">
                  {[
                    { role: 'Senior Software Engineer', company: 'Google', score: 94, date: '2 hours ago' },
                    { role: 'Product Manager', company: 'Meta', score: 87, date: '1 day ago' },
                    { role: 'Data Scientist', company: 'Netflix', score: 91, date: '3 days ago' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-fade-in" style={{ animationDelay: `${idx * 0.2}s` }}>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.role}</h4>
                        <p className="text-sm text-gray-600">{item.company} • {item.date}</p>
                      </div>
                      <Badge className={`${item.score >= 90 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Start New Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase More Credits
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume Templates
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'upload',
      title: 'Upload Resume',
      description: 'User uploads their professional resume',
      content: (
        <div className="bg-white min-h-[500px] rounded-xl p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
              <p className="text-gray-600 text-lg">Let's analyze your resume against your target job</p>
            </div>

            {uploadProgress === 0 ? (
              <div className="border-3 border-dashed border-blue-300 rounded-2xl p-12 text-center bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-blue-400 transition-all duration-200 cursor-pointer">
                <Upload className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-blue-700 mb-3">Drag & drop your resume here</h3>
                <p className="text-blue-600 mb-6">or click to browse files</p>
                <div className="flex justify-center space-x-4 text-sm text-blue-600">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    PDF supported
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    DOC/DOCX supported
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Up to 10MB
                  </span>
                </div>
              </div>
            ) : uploadProgress < 100 ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Sarah_Chen_Resume.pdf</h4>
                    <p className="text-sm text-gray-600">2.1 MB • Uploading...</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Upload progress</span>
                    <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Resume uploaded successfully! ✨</h4>
                    <p className="text-sm text-green-600">Sarah_Chen_Resume.pdf • Ready for analysis</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border border-green-300">
                    ATS-Compatible ✓
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'job-description',
      title: 'Add Job Description',
      description: 'Paste the target job description for analysis',
      content: (
        <div className="bg-white min-h-[500px] rounded-xl p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Description Analysis</h2>
              <p className="text-gray-600 text-lg">We're analyzing the job requirements to optimize your resume</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 border-2 border-green-200 bg-green-50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Senior Software Engineer</h3>
                    <p className="text-green-700 font-medium">TechCorp • San Francisco, CA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Requirements:</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL', 'MongoDB'].map((skill, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-800 border border-green-300 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Experience Level:</h4>
                    <p className="text-gray-700">5+ years of full-stack development experience</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Key Responsibilities:</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• Lead development of scalable web applications</li>
                      <li>• Architect microservices and APIs</li>
                      <li>• Mentor junior developers</li>
                      <li>• Collaborate with cross-functional teams</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  AI Analysis in Progress
                </h3>

                <div className="space-y-6">
                  {[
                    { task: "Extracting key requirements", status: "complete", icon: CheckCircle, color: "text-green-500" },
                    { task: "Identifying required skills", status: "complete", icon: CheckCircle, color: "text-green-500" },
                    { task: "Analyzing experience level", status: "progress", icon: Clock, color: "text-blue-500" },
                    { task: "Matching resume content", status: "pending", icon: Target, color: "text-gray-400" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${idx * 0.5}s` }}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className={`text-sm ${item.status === 'complete' ? 'text-gray-700' : item.status === 'progress' ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                        {item.task}
                      </span>
                      {item.status === 'progress' && (
                        <div className="ml-auto">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Processing job requirements...</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analysis',
      title: 'AI Analysis Results',
      description: 'Comprehensive analysis and scoring completed',
      content: (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-[500px] rounded-xl p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-xl">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Analysis Complete! 🎉</h2>
              <p className="text-gray-600 text-xl">Here's how your resume matches the job requirements</p>
            </div>

            {/* Overall Score Card */}
            <Card className="p-8 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-2xl mb-6 border-4 border-green-100">
                  <div className="text-center">
                    <span className="text-5xl font-black text-green-600 animate-scale-in">94</span>
                    <div className="text-lg font-medium text-gray-600">/100</div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Excellent Match! 🌟</h3>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Your resume is exceptionally well-suited for this position with strategic improvements applied.
                </p>
              </div>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { name: "Keyword Match", score: 96, icon: Target, color: "from-green-500 to-emerald-500", desc: "Keywords perfectly aligned" },
                { name: "ATS Compatibility", score: 94, icon: CheckCircle, color: "from-blue-500 to-cyan-500", desc: "Passes all ATS systems" },
                { name: "Skills Alignment", score: 92, icon: Zap, color: "from-purple-500 to-pink-500", desc: "Strong skill match" },
                { name: "Experience Match", score: 91, icon: TrendingUp, color: "from-orange-500 to-red-500", desc: "Experience well-aligned" }
              ].map((metric, index) => (
                <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 bg-white border-2 border-gray-100">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${metric.color} rounded-2xl mb-4 shadow-lg animate-scale-in`} style={{ animationDelay: `${index * 0.2}s` }}>
                      <metric.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{metric.score}%</div>
                    <h4 className="font-bold text-gray-900 mb-2">{metric.name}</h4>
                    <p className="text-sm text-gray-600">{metric.desc}</p>
                    <div className="mt-3">
                      <Progress value={metric.score} className="h-2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Key Improvements */}
            <Card className="p-6 bg-white shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="h-6 w-6 mr-3 text-yellow-500" />
                Key Improvements Made
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { text: "Added 8 strategic keywords for better ATS matching", icon: Target, color: "text-blue-600" },
                  { text: "Quantified achievements with specific metrics", icon: TrendingUp, color: "text-green-600" },
                  { text: "Enhanced professional summary with impact statements", icon: Star, color: "text-purple-600" },
                  { text: "Optimized technical skills section for role requirements", icon: Zap, color: "text-orange-600" }
                ].map((improvement, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl animate-fade-in" style={{ animationDelay: `${idx * 0.2}s` }}>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <improvement.icon className={`h-5 w-5 ${improvement.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-relaxed">{improvement.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: 'Export Optimized Resume',
      description: 'Download your tailored, interview-ready resume',
      content: (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[500px] rounded-xl p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6 shadow-xl animate-bounce">
                <Download className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Ready to Apply! 🚀</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your optimized resume is ready to help you land more interviews
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Export Options */}
              <Card className="p-8 bg-white shadow-xl border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-emerald-600" />
                  Export Options
                </h3>
                <div className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                    <Download className="mr-3 h-5 w-5" />
                    Download PDF Resume
                  </Button>
                  <Button variant="outline" className="w-full py-4 text-lg font-medium border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <Mail className="mr-3 h-5 w-5" />
                    Email Resume
                  </Button>
                  <Button variant="outline" className="w-full py-4 text-lg font-medium border-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Globe className="mr-3 h-5 w-5" />
                    Share Public Link
                  </Button>
                </div>
              </Card>

              {/* Success Statistics */}
              <Card className="p-8 bg-white shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-3 text-green-600" />
                  Your Success Forecast
                </h3>
                <div className="space-y-6">
                  {[
                    { metric: "Interview Rate Increase", value: "+340%", color: "text-green-600", bg: "bg-green-50" },
                    { metric: "ATS Pass Rate", value: "94%", color: "text-blue-600", bg: "bg-blue-50" },
                    { metric: "Recruiter Response Rate", value: "+180%", color: "text-purple-600", bg: "bg-purple-50" }
                  ].map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-4 rounded-xl animate-fade-in`} style={{ animationDelay: `${idx * 0.3}s` }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{stat.metric}</span>
                        <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Application Checklist */}
            <Card className="p-8 bg-white shadow-xl border-2 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                Application Ready Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Resume optimized for target job description",
                  "ATS compatibility verified and confirmed",
                  "Strategic keywords placed throughout resume",
                  "Achievements quantified with specific metrics",
                  "Professional summary enhanced with impact",
                  "Technical skills aligned with job requirements",
                  "Format optimized for modern hiring systems",
                  "Ready for immediate job application submission"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center mt-8">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-2xl shadow-xl text-white">
                <h4 className="text-2xl font-bold mb-3">Start Your Success Story Today!</h4>
                <p className="text-emerald-100 text-lg mb-6">
                  Join 25,000+ professionals who've accelerated their careers with SproutCV
                </p>
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4 font-bold shadow-lg">
                  Create Your Account - Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % demoSteps.length;
        
        // Reset progress bars when cycling
        if (nextStep === 1) { // Upload step
          setUploadProgress(0);
          setTimeout(() => {
            let progress = 0;
            const uploadInterval = setInterval(() => {
              progress += Math.random() * 15 + 5;
              if (progress >= 100) {
                progress = 100;
                clearInterval(uploadInterval);
              }
              setUploadProgress(progress);
            }, 200);
          }, 1000);
        }
        
        return nextStep;
      });
    }, 6000); // 6 seconds per step

    return () => clearInterval(interval);
  }, [isAnimating, demoSteps.length]);

  // Auto-progress upload when on upload step
  useEffect(() => {
    if (currentStep === 1 && uploadProgress === 0) {
      setTimeout(() => {
        let progress = 0;
        const uploadInterval = setInterval(() => {
          progress += Math.random() * 12 + 8;
          if (progress >= 100) {
            progress = 100;
            clearInterval(uploadInterval);
          }
          setUploadProgress(progress);
        }, 300);
      }, 2000);
    }
  }, [currentStep]);

  const currentStepData = demoSteps[currentStep];

  return (
    <div className="w-full">
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl overflow-hidden relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h3 className="text-2xl font-bold mb-2">{currentStepData.title}</h3>
              <p className="text-gray-300 text-lg">{currentStepData.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? '⏸️ Pause Demo' : '▶️ Play Demo'}
              </Button>
            </div>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex justify-center space-x-3 mb-6">
            {demoSteps.map((_, index) => (
              <button
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-white scale-125 shadow-lg' 
                    : index < currentStep 
                      ? 'bg-green-400 hover:bg-green-300' 
                      : 'bg-white/30 hover:bg-white/50'
                }`}
                onClick={() => {
                  setCurrentStep(index);
                  setIsAnimating(false);
                }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Demo Content */}
      <div className="animate-fade-in shadow-2xl rounded-2xl overflow-hidden border-2 border-gray-200">
        {currentStepData.content}
      </div>

      {/* Auto-play indicator */}
      {isAnimating && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center space-x-3 shadow-lg border border-gray-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Live Demo Playing</span>
            <Badge className="bg-green-100 text-green-800 text-xs">
              Step {currentStep + 1} of {demoSteps.length}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedDemo;
