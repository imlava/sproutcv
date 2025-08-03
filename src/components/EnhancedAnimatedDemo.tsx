
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Building,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';

const EnhancedAnimatedDemo = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  const demoSections = [
    {
      id: 'dashboard',
      title: 'Real-Time Dashboard Experience',
      subtitle: 'Your personalized command center',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'upload',
      title: 'Intelligent Resume Upload',
      subtitle: 'Drag, drop, and let AI do the magic',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'analysis',
      title: 'Advanced AI Analysis Engine',
      subtitle: 'Deep learning meets career optimization',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'results',
      title: 'Actionable Insights & Results',
      subtitle: 'Your roadmap to success',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'export',
      title: 'Professional Export & Success',
      subtitle: 'Interview-ready resume in seconds',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const sectionHeight = container.scrollHeight / demoSections.length;
        const nextSection = (currentSection + 1) % demoSections.length;
        
        container.scrollTo({
          top: nextSection * sectionHeight,
          behavior: 'smooth'
        });
        
        setCurrentSection(nextSection);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSection, demoSections.length]);

  // Progress animations
  useEffect(() => {
    if (currentSection === 1) { // Upload section
      setUploadProgress(0);
      const timer = setTimeout(() => {
        let progress = 0;
        const uploadInterval = setInterval(() => {
          progress += Math.random() * 15 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(uploadInterval);
          }
          setUploadProgress(progress);
        }, 200);
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    if (currentSection === 2) { // Analysis section
      setAnalysisProgress(0);
      const timer = setTimeout(() => {
        let progress = 0;
        const analysisInterval = setInterval(() => {
          progress += Math.random() * 12 + 8;
          if (progress >= 100) {
            progress = 100;
            clearInterval(analysisInterval);
          }
          setAnalysisProgress(progress);
        }, 300);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentSection]);

  const handleSectionClick = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const sectionHeight = container.scrollHeight / demoSections.length;
      container.scrollTo({
        top: index * sectionHeight,
        behavior: 'smooth'
      });
      setCurrentSection(index);
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Control Panel */}
      <div className="mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Live SproutCV Experience
          </h2>
          <p className="text-lg text-gray-600">
            Scroll through our real-time demo or use auto-play to see the complete workflow
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={isPlaying ? "default" : "outline"}
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-3"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Demo
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play Demo
              </>
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            {demoSections.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSection 
                    ? 'bg-green-500 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => handleSectionClick(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Demo Container */}
      <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
        <ScrollArea className="h-[800px]" ref={scrollContainerRef}>
          <div className="space-y-0">
            
            {/* Dashboard Section */}
            <div className="min-h-[800px] bg-gradient-to-br from-emerald-50 to-teal-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-emerald-100 bg-[size:20px_20px] opacity-30" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2 mb-4">
                    <Sprout className="h-4 w-4 mr-2" />
                    Dashboard Overview
                  </Badge>
                  <h3 className="text-4xl font-black text-gray-900 mb-3">
                    Welcome to Your Career Hub
                  </h3>
                  <p className="text-xl text-gray-600">
                    Your personalized dashboard with real-time insights and analytics
                  </p>
                </div>

                {/* Real Dashboard UI */}
                <div className="max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Sprout className="h-6 w-6" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold">SproutCV Dashboard</h1>
                            <p className="text-emerald-100">Welcome back, User</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 px-4 py-2 rounded-lg flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-semibold">15 Credits</span>
                          </div>
                          <Bell className="h-6 w-6 cursor-pointer hover:scale-110 transition-transform" />
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                      { title: 'Resumes Analyzed', value: '127', icon: FileText, color: 'from-blue-500 to-cyan-500', change: '+23%' },
                      { title: 'Interview Requests', value: '89', icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+156%' },
                      { title: 'Average Score', value: '94', icon: Target, color: 'from-purple-500 to-pink-500', change: '+12%' },
                      { title: 'Success Rate', value: '87%', icon: Star, color: 'from-orange-500 to-red-500', change: '+34%' }
                    ].map((stat, index) => (
                      <Card key={index} className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {stat.change}
                          </Badge>
                        </div>
                        <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.title}</div>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-6 bg-white shadow-lg">
                      <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-blue-600" />
                        Recent Analyses
                      </h4>
                      <div className="space-y-4">
                        {[
                                  { role: 'Senior Software Engineer', company: 'Tech Company', score: 97, time: '2 hours ago', status: 'success' },
        { role: 'Product Manager', company: 'Startup', score: 89, time: '1 day ago', status: 'good' },
        { role: 'UX Designer', company: 'Enterprise', score: 92, time: '2 days ago', status: 'success' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{item.role}</h5>
                                <p className="text-sm text-gray-600">{item.company} • {item.time}</p>
                              </div>
                            </div>
                            <Badge className={`${item.score >= 95 ? 'bg-green-100 text-green-800' : item.score >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {item.score}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6 bg-white shadow-lg">
                      <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Performance Insights
                      </h4>
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Interview Conversion Rate</span>
                            <span className="text-2xl font-bold text-green-600">87%</span>
                          </div>
                          <Progress value={87} className="h-2 bg-green-200" />
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">ATS Compatibility</span>
                            <span className="text-2xl font-bold text-blue-600">96%</span>
                          </div>
                          <Progress value={96} className="h-2 bg-blue-200" />
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Keyword Optimization</span>
                            <span className="text-2xl font-bold text-purple-600">94%</span>
                          </div>
                          <Progress value={94} className="h-2 bg-purple-200" />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="min-h-[800px] bg-gradient-to-br from-blue-50 to-cyan-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-blue-100 bg-[size:20px_20px] opacity-30" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Smart Upload System
                  </Badge>
                  <h3 className="text-4xl font-black text-gray-900 mb-3">
                    Intelligent Resume Processing
                  </h3>
                  <p className="text-xl text-gray-600">
                    Advanced AI instantly analyzes and understands your resume structure
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  {uploadProgress === 0 ? (
                    <Card className="p-12 bg-white shadow-2xl border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-300 cursor-pointer group">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="h-12 w-12 text-white" />
                        </div>
                        <h4 className="text-3xl font-bold text-blue-700 mb-4">Drop Your Resume Here</h4>
                        <p className="text-xl text-blue-600 mb-8">or click to browse your files</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {[
                            { icon: CheckCircle, text: 'PDF, DOC, DOCX supported' },
                            { icon: Zap, text: 'Instant AI processing' },
                            { icon: Target, text: 'ATS compatibility check' }
                          ].map((feature, idx) => (
                            <div key={idx} className="flex items-center justify-center space-x-2 text-blue-700">
                              <feature.icon className="h-5 w-5" />
                              <span className="font-medium">{feature.text}</span>
                            </div>
                          ))}
                        </div>

                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold">
                          Choose File
                        </Button>
                      </div>
                    </Card>
                  ) : uploadProgress < 100 ? (
                    <Card className="p-8 bg-white shadow-2xl border-2 border-blue-200">
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900">Sarah_Chen_Resume.pdf</h4>
                          <p className="text-lg text-gray-600">2.3 MB • Processing with AI...</p>
                        </div>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">Upload Progress</span>
                          <span className="text-2xl font-bold text-blue-600">{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-4 bg-blue-100" />
                      </div>

                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { step: 'File validation', status: 'complete' },
                          { step: 'Content extraction', status: uploadProgress > 30 ? 'complete' : 'progress' },
                          { step: 'Structure analysis', status: uploadProgress > 70 ? 'progress' : 'pending' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            {item.status === 'complete' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : item.status === 'progress' ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                            <span className={`text-sm font-medium ${item.status === 'complete' ? 'text-green-700' : item.status === 'progress' ? 'text-blue-700' : 'text-gray-500'}`}>
                              {item.step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-8 bg-white shadow-2xl border-2 border-green-200">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 flex items-center">
                            Upload Complete! 
                            <Star className="h-6 w-6 text-yellow-500 ml-2" />
                          </h4>
                          <p className="text-lg text-green-600">Sarah_Chen_Resume.pdf • Ready for AI analysis</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-2 border-green-300 px-4 py-2">
                          ATS Compatible ✓
                        </Badge>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="min-h-[800px] bg-gradient-to-br from-purple-50 to-pink-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-purple-100 bg-[size:20px_20px] opacity-30" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-purple-100 text-purple-800 px-4 py-2 mb-4">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    AI Analysis Engine
                  </Badge>
                  <h3 className="text-4xl font-black text-gray-900 mb-3">
                    Deep Learning Analysis
                  </h3>
                  <p className="text-xl text-gray-600">
                    Advanced algorithms analyze every aspect of your resume
                  </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-8 bg-white shadow-2xl">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Zap className="h-6 w-6 mr-3 text-purple-600" />
                      AI Processing Status
                    </h4>

                    <div className="space-y-6">
                      {[
                        { task: "Content extraction & parsing", status: "complete", time: "0.2s" },
                        { task: "Keyword density analysis", status: "complete", time: "0.4s" },
                        { task: "ATS compatibility check", status: "complete", time: "0.6s" },
                        { task: "Skills gap identification", status: analysisProgress > 25 ? "complete" : "progress", time: "0.8s" },
                        { task: "Experience quantification", status: analysisProgress > 50 ? "complete" : "progress", time: "1.1s" },
                        { task: "Achievement optimization", status: analysisProgress > 75 ? "progress" : "pending", time: "1.4s" },
                        { task: "Final scoring & recommendations", status: analysisProgress === 100 ? "complete" : "pending", time: "1.8s" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            {item.status === 'complete' ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : item.status === 'progress' ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                            ) : (
                              <Clock className="h-6 w-6 text-gray-400" />
                            )}
                            <div>
                              <span className={`font-medium ${item.status === 'complete' ? 'text-green-700' : item.status === 'progress' ? 'text-purple-700' : 'text-gray-500'}`}>
                                {item.task}
                              </span>
                              {item.status === 'complete' && (
                                <div className="text-sm text-gray-500">Completed in {item.time}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 bg-purple-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-medium text-gray-700">Overall Progress</span>
                        <span className="text-2xl font-bold text-purple-600">{Math.round(analysisProgress)}%</span>
                      </div>
                      <Progress value={analysisProgress} className="h-3 bg-purple-200" />
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card className="p-6 bg-white shadow-xl">
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        Live Analysis Preview
                      </h4>
                      <div className="space-y-4">
                        {[
                          { metric: "Keywords Found", value: "47/52", progress: 90, color: "green" },
                          { metric: "ATS Score", value: "96%", progress: 96, color: "blue" },
                          { metric: "Content Quality", value: "A+", progress: 95, color: "purple" },
                          { metric: "Format Score", value: "98%", progress: 98, color: "orange" }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">{item.metric}</span>
                              <span className={`font-bold text-${item.color}-600`}>{item.value}</span>
                            </div>
                            <Progress value={item.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6 bg-white shadow-xl">
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Real-time Improvements
                      </h4>
                      <div className="space-y-3">
                        {[
                          "Enhanced professional summary with impact metrics",
                          "Optimized technical skills section for ATS",
                          "Added 12 strategic keywords for better matching",
                          "Quantified achievements with specific numbers"
                        ].map((improvement, idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-green-700 bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="min-h-[800px] bg-gradient-to-br from-orange-50 to-red-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-orange-100 bg-[size:20px_20px] opacity-30" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-orange-100 text-orange-800 px-4 py-2 mb-4">
                    <Star className="h-4 w-4 mr-2" />
                    Results & Insights
                  </Badge>
                  <h3 className="text-4xl font-black text-gray-900 mb-3">
                    Your Success Metrics
                  </h3>
                  <p className="text-xl text-gray-600">
                    Comprehensive analysis with actionable recommendations
                  </p>
                </div>

                <div className="max-w-6xl mx-auto">
                  {/* Overall Score */}
                  <Card className="p-12 mb-8 bg-white shadow-2xl border-2 border-orange-200">
                    <div className="text-center">
                      <div className="w-40 h-40 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <div className="text-center text-white">
                          <div className="text-6xl font-black">97</div>
                          <div className="text-xl font-medium opacity-90">/100</div>
                        </div>
                      </div>
                      <h4 className="text-4xl font-black text-gray-900 mb-4">Outstanding Score! 🎉</h4>
                      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Your resume is exceptionally well-optimized and ready to impress recruiters
                      </p>
                    </div>
                  </Card>

                  {/* Detailed Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                      { name: "ATS Compatibility", score: 98, icon: CheckCircle, desc: "Perfect formatting" },
                      { name: "Keyword Match", score: 94, icon: Target, desc: "Excellent alignment" },
                      { name: "Content Quality", score: 96, icon: Star, desc: "Professional grade" },
                      { name: "Impact Score", score: 99, icon: TrendingUp, desc: "Maximum impact" }
                    ].map((metric, idx) => (
                      <Card key={idx} className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <metric.icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-3xl font-black text-gray-900 mb-2">{metric.score}%</div>
                          <h5 className="font-bold text-gray-900 mb-2">{metric.name}</h5>
                          <p className="text-sm text-gray-600">{metric.desc}</p>
                          <Progress value={metric.score} className="h-2 mt-3" />
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Key Improvements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-8 bg-white shadow-xl">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Zap className="h-6 w-6 mr-3 text-yellow-500" />
                        Applied Optimizations
                      </h4>
                      <div className="space-y-4">
                        {[
                          { text: "Enhanced professional summary with quantified achievements", impact: "+15% ATS score" },
                          { text: "Strategic keyword placement throughout document", impact: "+23% match rate" },
                          { text: "Improved formatting for better readability", impact: "+12% recruiter engagement" },
                          { text: "Added action verbs and industry terminology", impact: "+18% impact score" }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between p-4 bg-yellow-50 rounded-xl">
                            <div className="flex items-start space-x-3 flex-1">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700">{item.text}</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800 text-xs ml-3">
                              {item.impact}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-8 bg-white shadow-xl">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="h-6 w-6 mr-3 text-green-500" />
                        Success Prediction
                      </h4>
                      <div className="space-y-6">
                        {[
                          { metric: "Interview Rate Increase", value: "+340%", desc: "Based on optimizations applied" },
                          { metric: "Recruiter Response Rate", value: "87%", desc: "Predicted response likelihood" },
                          { metric: "ATS Pass Rate", value: "98%", desc: "Will pass major ATS systems" }
                        ].map((prediction, idx) => (
                          <div key={idx} className="bg-green-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">{prediction.metric}</span>
                              <span className="text-2xl font-black text-green-600">{prediction.value}</span>
                            </div>
                            <p className="text-sm text-gray-600">{prediction.desc}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="min-h-[800px] bg-gradient-to-br from-green-50 to-emerald-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-green-100 bg-[size:20px_20px] opacity-30" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-green-100 text-green-800 px-4 py-2 mb-4">
                    <Download className="h-4 w-4 mr-2" />
                    Export & Success
                  </Badge>
                  <h3 className="text-4xl font-black text-gray-900 mb-3">
                    Your Interview-Ready Resume
                  </h3>
                  <p className="text-xl text-gray-600">
                    Download your optimized resume and start landing interviews
                  </p>
                </div>

                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Export Options */}
                    <Card className="p-8 bg-white shadow-2xl">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Download className="h-6 w-6 mr-3 text-green-600" />
                        Export Your Success
                      </h4>
                      <div className="space-y-4">
                        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-semibold shadow-lg">
                          <Download className="mr-3 h-5 w-5" />
                          Download Optimized PDF
                        </Button>
                        <Button variant="outline" className="w-full py-4 text-lg font-medium border-2 border-green-300 text-green-700 hover:bg-green-50">
                          <Mail className="mr-3 h-5 w-5" />
                          Email to Myself
                        </Button>
                        <Button variant="outline" className="w-full py-4 text-lg font-medium border-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                          <Globe className="mr-3 h-5 w-5" />
                          Create Shareable Link
                        </Button>
                      </div>

                      <div className="mt-8 p-6 bg-green-50 rounded-xl">
                        <h5 className="font-bold text-green-800 mb-3 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Quality Assurance Complete
                        </h5>
                        <div className="space-y-2 text-sm">
                          {[
                            "ATS compatibility verified",
                            "Professional formatting applied",
                            "Keywords strategically placed",
                            "Impact statements optimized",
                            "Ready for immediate application"
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>

                    {/* Success Metrics */}
                    <Card className="p-8 bg-white shadow-2xl">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Star className="h-6 w-6 mr-3 text-yellow-500" />
                        Your Success Forecast
                      </h4>
                      <div className="space-y-6">
                        <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                          <div className="text-4xl font-black text-orange-600 mb-2">97%</div>
                          <p className="text-lg font-semibold text-gray-800">Overall Resume Score</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Interview Rate", value: "+340%", icon: TrendingUp },
                            { label: "ATS Pass Rate", value: "98%", icon: Target },
                            { label: "Response Rate", value: "+180%", icon: Mail },
                            { label: "Match Score", value: "94%", icon: CheckCircle }
                          ].map((metric, idx) => (
                            <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                              <metric.icon className="h-6 w-6 mx-auto mb-2 text-green-600" />
                              <div className="text-xl font-bold text-gray-900">{metric.value}</div>
                              <div className="text-xs text-gray-600">{metric.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Final CTA */}
                  <Card className="p-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center shadow-2xl">
                    <Star className="h-16 w-16 mx-auto mb-6 opacity-90" />
                    <h4 className="text-3xl font-black mb-6">Ready to Transform Your Career?</h4>
                    <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                      You've seen the power of SproutCV. Now it's time to experience it yourself and land your dream job.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold">
                        Start Your Free Analysis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-bold">
                        View Pricing Plans
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default EnhancedAnimatedDemo;
