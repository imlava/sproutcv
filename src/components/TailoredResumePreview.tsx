
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Zap, Target, Download, Mail, Share2, FileText } from 'lucide-react';

interface TailoredResumePreviewProps {
  onExport?: () => void;
  onShare?: () => void;
  onEmail?: () => void;
}

const TailoredResumePreview: React.FC<TailoredResumePreviewProps> = ({ 
  onExport, 
  onShare, 
  onEmail 
}) => {
  const addedKeywords = ['React', 'Node.js', 'AWS', 'TypeScript', 'GraphQL'];
  const improvements = [
    { text: 'Quantified achievements with specific metrics', icon: Target, color: 'text-blue-600' },
    { text: 'ATS-friendly formatting applied throughout', icon: CheckCircle, color: 'text-green-600' },
    { text: 'Strategic keyword placement optimized', icon: Zap, color: 'text-purple-600' },
    { text: 'Professional summary significantly enhanced', icon: Star, color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-3xl font-bold text-gray-900">
                Resume Optimized! 🎉
              </h3>
              <p className="text-green-700 font-medium">
                Tailored for "Senior Software Engineer" at Tech Corp
              </p>
            </div>
          </div>
        </div>

        {/* Resume Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">John Doe</h2>
              <p className="text-xl text-green-600 font-semibold mb-2">Senior Software Engineer</p>
              <p className="text-gray-600">john.doe@email.com • (555) 123-4567 • San Francisco, CA • LinkedIn: /in/johndoe</p>
            </div>

            {/* Professional Summary */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                Professional Summary
                <Badge className="ml-3 bg-green-100 text-green-800 border-green-300">✨ Enhanced</Badge>
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                Results-driven Senior Software Engineer with <span className="bg-yellow-100 px-1 rounded font-semibold">5+ years</span> 
                of experience developing scalable web applications using{' '}
                <span className="bg-yellow-100 px-1 rounded font-semibold">React, Node.js, and AWS</span>. 
                Successfully led cross-functional teams of{' '}
                <span className="bg-yellow-100 px-1 rounded font-semibold">8+ developers</span> and delivered{' '}
                <span className="bg-yellow-100 px-1 rounded font-semibold">15+ enterprise projects</span> resulting in{' '}
                <span className="bg-yellow-100 px-1 rounded font-semibold">40% performance improvements</span> and{' '}
                <span className="bg-yellow-100 px-1 rounded font-semibold">$2M+ cost savings</span>.
              </p>
            </div>

            {/* Technical Skills */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                Technical Skills
                <Badge className="ml-3 bg-blue-100 text-blue-800 border-blue-300">🎯 Optimized</Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL', 'MongoDB', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Jest', 'Webpack'].map((skill, index) => (
                  <Badge 
                    key={index} 
                    className={`${addedKeywords.includes(skill) ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-300'} px-3 py-1 text-sm font-medium`}
                  >
                    {skill}
                    {addedKeywords.includes(skill) && <span className="ml-1">✨</span>}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                Professional Experience
                <Badge className="ml-3 bg-purple-100 text-purple-800 border-purple-300">📊 Quantified</Badge>
              </h3>
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-6">
                  <h4 className="text-lg font-bold text-gray-900">Senior Software Engineer • TechStart Inc.</h4>
                  <p className="text-gray-600 mb-3 font-medium">March 2021 - Present | San Francisco, CA</p>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Led development of <span className="bg-yellow-100 px-1 rounded font-semibold">React-based</span> customer dashboard serving{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">50,000+ users</span>, increasing user engagement by{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">35%</span> and reducing bounce rate by{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">28%</span></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Architected and deployed <span className="bg-yellow-100 px-1 rounded font-semibold">Node.js microservices</span> on{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">AWS ECS</span>, reducing API response times by{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">50%</span> and improving system reliability to{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">99.9% uptime</span></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Mentored <span className="bg-yellow-100 px-1 rounded font-semibold">6 junior developers</span>, established code review processes, and implemented{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">CI/CD pipelines</span> reducing deployment time by{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">60%</span></span>
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h4 className="text-lg font-bold text-gray-900">Software Engineer • DataFlow Solutions</h4>
                  <p className="text-gray-600 mb-3 font-medium">January 2020 - February 2021 | Remote</p>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Developed full-stack applications using <span className="bg-yellow-100 px-1 rounded font-semibold">React</span> and{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">Node.js</span>, serving{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">10,000+ daily active users</span></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Implemented <span className="bg-yellow-100 px-1 rounded font-semibold">GraphQL APIs</span> and optimized database queries, improving data loading speeds by{' '}
                      <span className="bg-yellow-100 px-1 rounded font-semibold">45%</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Improvements Made */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {improvements.map((improvement, index) => {
            const IconComponent = improvement.icon;
            return (
              <div key={index} className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg">
                  <IconComponent className={`h-5 w-5 ${improvement.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 leading-relaxed">{improvement.text}</span>
              </div>
            );
          })}
        </div>

        {/* Added Keywords */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Keywords Added for Better ATS Matching
          </h4>
          <div className="flex flex-wrap gap-3">
            {addedKeywords.map((keyword, index) => (
              <Badge key={index} className="bg-green-100 text-green-800 border-2 border-green-300 px-3 py-1 text-sm font-semibold">
                +{keyword}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            These keywords were strategically placed throughout your resume to improve ATS compatibility and keyword matching.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onExport}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="mr-2 h-5 w-5" />
            Export as PDF
          </Button>
          
          <Button 
            onClick={onEmail}
            size="lg"
            variant="outline"
            className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
          >
            <Mail className="mr-2 h-5 w-5" />
            Email Resume
          </Button>
          
          <Button 
            onClick={onShare}
            size="lg"
            variant="outline"
            className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share Link
          </Button>
        </div>
      </Card>

      {/* Application Checklist */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Application Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Resume optimized for job description',
            'ATS compatibility verified',
            'Keywords strategically placed',
            'Achievements quantified with metrics',
            'Professional summary enhanced',
            'Ready for application submission'
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TailoredResumePreview;
