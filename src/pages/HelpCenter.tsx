
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Search, BookOpen, MessageCircle, FileText, Zap, Shield, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Find answers to your questions and get the most out of SproutCV
              </p>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <BookOpen className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
              <p className="text-gray-600">Learn the basics of using SproutCV to optimize your resume</p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Zap className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Understand how our AI analyzes and improves your resume</p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CreditCard className="h-8 w-8 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Billing & Plans</h3>
              <p className="text-gray-600">Manage your subscription and understand pricing</p>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>How does SproutCV's AI analysis work?</AccordionTrigger>
                  <AccordionContent>
                    Our AI analyzes your resume against job descriptions using advanced natural language processing. It checks for keyword matches, formatting issues, ATS compatibility, and provides specific recommendations to improve your chances of getting interviews.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is my resume data secure and private?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We use enterprise-grade security measures to protect your data. Your resume is processed securely and is never shared with third parties. We comply with all major data protection regulations including GDPR.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>What file formats do you support?</AccordionTrigger>
                  <AccordionContent>
                    SproutCV supports PDF, DOC, and DOCX file formats. We recommend using PDF format for the best analysis results as it preserves formatting across different systems.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>How many resumes can I analyze?</AccordionTrigger>
                  <AccordionContent>
                    This depends on your plan. Free users get 3 analyses per month, while premium users get unlimited analyses. You can upgrade your plan anytime from your dashboard.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I cancel my subscription anytime?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and you won't be charged again.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
            <p className="text-gray-600 mb-6">Our support team is here to help you succeed</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HelpCenter;
