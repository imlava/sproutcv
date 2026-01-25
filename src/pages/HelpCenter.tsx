
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Zap, 
  Shield, 
  CreditCard,
  Upload,
  Target,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Video,
  Download,
  Mail,
  Phone,
  Clock,
  Globe,
  Users,
  Star,
  TrendingUp,
  Settings,
  Eye,
  Lock
} from 'lucide-react';
import Header from '@/components/Header';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';
import Footer from '@/components/Footer';

const HelpCenter = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Comprehensive FAQ data
  const faqData = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I get started with SproutCV?',
      answer: 'Getting started is easy! Simply sign up for a free account, upload your resume, and paste a job description you\'re interested in. Our AI will analyze your resume and provide detailed feedback within seconds.',
      tags: ['beginner', 'signup', 'first-time']
    },
    {
      id: 2,
      category: 'ai-analysis',
      question: 'How does SproutCV\'s AI analysis work?',
      answer: 'Our AI uses advanced natural language processing to analyze your resume against job descriptions. It checks for keyword matches, formatting issues, ATS compatibility, skills alignment, and experience relevance. The system provides scored feedback and specific recommendations to improve your chances of getting interviews.',
      tags: ['ai', 'analysis', 'technology']
    },
    {
      id: 3,
      category: 'security',
      question: 'Is my resume data secure and private?',
      answer: 'Absolutely. We use enterprise-grade security measures including encryption in transit and at rest. Your resume is processed securely and is never shared with third parties. We comply with all major data protection regulations including GDPR and CCPA. Your data is automatically deleted after 30 days unless you save it.',
      tags: ['security', 'privacy', 'data']
    },
    {
      id: 4,
      category: 'getting-started',
      question: 'What file formats do you support?',
      answer: 'SproutCV supports PDF, DOC, and DOCX file formats. We recommend using PDF format for the best analysis results as it preserves formatting across different systems and ensures accurate parsing by our AI.',
      tags: ['formats', 'upload', 'pdf']
    },
    {
      id: 5,
      category: 'billing',
      question: 'How many resumes can I analyze?',
      answer: 'This depends on your plan: Free users get 3 analyses per month, Basic plan includes 10 analyses per month, and Premium users get unlimited analyses. You can upgrade your plan anytime from your dashboard.',
      tags: ['limits', 'plans', 'billing']
    },
    {
      id: 6,
      category: 'billing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won\'t be charged again. No cancellation fees apply.',
      tags: ['cancel', 'subscription', 'billing']
    },
    {
      id: 7,
      category: 'ai-analysis',
      question: 'What is ATS compatibility and why is it important?',
      answer: 'ATS (Applicant Tracking System) compatibility refers to how well your resume can be parsed and understood by automated hiring systems. Over 75% of companies use ATS to screen resumes. Our AI checks your formatting, keywords, and structure to ensure your resume passes ATS screening.',
      tags: ['ats', 'compatibility', 'screening']
    },
    {
      id: 8,
      category: 'getting-started',
      question: 'How accurate are the analysis results?',
      answer: 'Our AI has been trained on thousands of successful resumes and job descriptions across various industries. The analysis accuracy is over 90% for keyword matching and ATS compatibility. However, results should be used as guidance alongside your professional judgment.',
      tags: ['accuracy', 'results', 'reliability']
    },
    {
      id: 9,
      category: 'ai-analysis',
      question: 'Can I analyze the same resume for different jobs?',
      answer: 'Absolutely! In fact, we recommend tailoring your resume for each job application. You can upload the same resume multiple times with different job descriptions to get specific recommendations for each position.',
      tags: ['multiple', 'jobs', 'tailoring']
    },
    {
      id: 10,
      category: 'billing',
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for premium subscriptions. If you\'re not satisfied with our service, contact our support team within 30 days of purchase for a full refund.',
      tags: ['refund', 'guarantee', 'money-back']
    },
    {
      id: 11,
      category: 'getting-started',
      question: 'How long does analysis take?',
      answer: 'Most analyses complete within 30-60 seconds. Complex resumes or longer job descriptions may take up to 2 minutes. You\'ll receive real-time progress updates during the analysis.',
      tags: ['speed', 'time', 'duration']
    },
    {
      id: 12,
      category: 'ai-analysis',
      question: 'What makes SproutCV different from other tools?',
      answer: 'SproutCV offers Fortune 500-grade AI analysis, real-time ATS compatibility checking, industry-specific recommendations, and detailed scoring across multiple dimensions. Our AI is continuously updated with the latest hiring trends and requirements.',
      tags: ['comparison', 'features', 'unique']
    }
  ];

  // Help categories
  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Learn the basics of using SproutCV to optimize your resume',
      articles: 8
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Understand how our AI analyzes and improves your resume',
      articles: 12
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Manage your subscription and understand pricing',
      articles: 6
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Learn about data protection and privacy measures',
      articles: 4
    }
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  };

  const handleStartAnalysis = () => {
    navigate('/analyze');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {user ? (
        <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />
      ) : (
        <Header />
      )}
      
      <div className={user ? "pt-4" : "pt-20"}>
        {/* Enhanced Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <HelpCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Find answers to your questions and get the most out of SproutCV
              </p>
              
              {/* Enhanced Search */}
              <div className="max-w-md mx-auto relative mb-8">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>30+ Help Articles</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-purple-500 mr-2" />
                  <span>10k+ Users Helped</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Help Categories with Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
              <TabsList className="grid grid-cols-5 w-auto">
                <TabsTrigger value="all" className="px-4">All</TabsTrigger>
                <TabsTrigger value="getting-started" className="px-4">Getting Started</TabsTrigger>
                <TabsTrigger value="ai-analysis" className="px-4">AI Analysis</TabsTrigger>
                <TabsTrigger value="billing" className="px-4">Billing</TabsTrigger>
                <TabsTrigger value="security" className="px-4">Security</TabsTrigger>
              </TabsList>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.id}
                    className={`p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${
                      selectedCategory === category.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className={`p-3 ${category.bgColor} rounded-lg w-fit mb-4`}>
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {category.articles} articles
                    </Badge>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-lg transition-shadow">
                <Upload className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Start Analysis</h3>
                <p className="mb-4 opacity-90">Upload your resume and get instant AI-powered feedback</p>
                <Button 
                  variant="secondary" 
                  onClick={handleStartAnalysis}
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Analyze Resume
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-shadow">
                <Video className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
                <p className="mb-4 opacity-90">Watch step-by-step guides to master SproutCV</p>
                <Button 
                  variant="secondary"
                  onClick={() => window.open('https://youtube.com/@sproutcv', '_blank')}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Videos
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-lg transition-shadow">
                <MessageCircle className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
                <p className="mb-4 opacity-90">Get instant help from our support team</p>
                <Button 
                  variant="secondary"
                  onClick={handleContactSupport}
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Card>
            </div>

            {/* FAQ Section with Enhanced Content */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedCategory === 'all' ? 'All Questions' : 
                     categories.find(c => c.id === selectedCategory)?.title + ' Questions'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>
                
                {searchQuery && (
                  <Button 
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
              
              {filteredFAQs.length === 0 ? (
                <Card className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or browse our categories above
                  </p>
                  <Button 
                    onClick={handleContactSupport}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Contact Support Instead
                  </Button>
                </Card>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <Accordion type="single" collapsible className="space-y-4">
                    {filteredFAQs.map((faq, index) => (
                      <AccordionItem 
                        key={faq.id} 
                        value={`item-${faq.id}`}
                        className="border border-gray-200 rounded-lg px-6 bg-white shadow-sm"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-6">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1 pr-4">
                              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                              <div className="flex flex-wrap gap-2">
                                {faq.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                              Was this helpful? 
                              <Button variant="link" className="p-0 ml-2 text-green-600 h-auto" onClick={handleContactSupport}>
                                Contact us for more help
                              </Button>
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          </Tabs>

          {/* Additional Resources */}
          <div className="bg-white rounded-lg p-8 border-2 border-gray-100 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-gray-600 text-sm mb-4">Comprehensive guides and API docs</p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/docs', '_blank')}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  View Docs
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-gray-600 text-sm mb-4">Connect with other users</p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://discord.gg/sproutcv', '_blank')}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Join Community
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Resources</h3>
                <p className="text-gray-600 text-sm mb-4">Templates and examples</p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/resources', '_blank')}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Contact Support Section */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className="text-xl mb-6 opacity-90">
              Our support team is here to help you succeed with your career goals
            </p>
            
            {/* Call-to-Action Highlight */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-8 border border-white/30">
              <p className="text-lg font-semibold mb-2">Quick Actions</p>
              <p className="text-sm opacity-90">
                Get instant help, return to our homepage, or start analyzing your resume right now
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Mail className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-sm opacity-90 mb-4">Get detailed help via email</p>
                <p className="text-sm font-mono">support@sproutcv.app</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <MessageCircle className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-sm opacity-90 mb-4">Instant help from our team</p>
                <p className="text-sm">24/7 availability</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Phone className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-sm opacity-90 mb-4">Call us for urgent issues</p>
                <p className="text-sm">Business hours only</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
              <Button 
                size="lg"
                onClick={handleContactSupport}
                className="bg-white text-green-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/')}
                className="bg-green-700 text-white hover:bg-green-800 border-2 border-green-400 shadow-lg hover:shadow-xl font-semibold transition-all duration-200 transform hover:scale-105 ring-2 ring-white/30"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
              <Button 
                size="lg"
                onClick={handleStartAnalysis}
                className="bg-emerald-600 text-white hover:bg-emerald-700 border-2 border-emerald-400 shadow-lg hover:shadow-xl font-semibold transition-all duration-200 transform hover:scale-105 ring-2 ring-white/30"
              >
                <Target className="h-5 w-5 mr-2" />
                Try Analysis
              </Button>
            </div>
            
            {/* Response Time Indicator */}
            <div className="mt-8 flex items-center justify-center space-x-4 text-sm opacity-75">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Average response: 2 hours</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                <span>4.9/5 satisfaction rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {/* Payment Modal */}
      {user && (
        <DodoPaymentModal 
          isOpen={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={refreshProfile}
        />
      )}
    </div>
  );
};

export default HelpCenter;
