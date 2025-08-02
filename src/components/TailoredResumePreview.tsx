
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Zap, Target } from 'lucide-react';

const TailoredResumePreview = () => {
  const addedKeywords = ['React', 'Node.js', 'AWS', 'TypeScript', 'GraphQL'];
  const optimizedSections = ['Technical Skills', 'Work Experience', 'Projects'];
  const improvements = [
    { text: 'Quantified achievements with metrics', icon: Target },
    { text: 'ATS-friendly formatting applied', icon: CheckCircle },
    { text: 'Keywords strategically placed', icon: Zap },
    { text: 'Professional summary enhanced', icon: Star }
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Your Tailored Resume is Ready! 🎉
        </h3>
        <p className="text-gray-700 text-lg">
          Optimized specifically for "Senior Software Engineer" at Tech Corp
        </p>
      </div>

      {/* Resume Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">John Doe</h2>
            <p className="text-lg text-green-600 font-semibold">Senior Software Engineer</p>
            <p className="text-gray-600">john.doe@email.com • (555) 123-4567 • San Francisco, CA</p>
          </div>

          {/* Professional Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              Professional Summary
              <Badge className="ml-2 bg-green-100 text-green-800">✨ Enhanced</Badge>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Experienced Senior Software Engineer with <span className="bg-yellow-100 px-1 rounded font-semibold">5+ years</span> 
              developing scalable web applications using <span className="bg-yellow-100 px-1 rounded font-semibold">React, Node.js, and AWS</span>. 
              Led teams of <span className="bg-yellow-100 px-1 rounded font-semibold">8+ developers</span> and delivered projects 
              resulting in <span className="bg-yellow-100 px-1 rounded font-semibold">40% performance improvements</span>.
            </p>
          </div>

          {/* Technical Skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              Technical Skills
              <Badge className="ml-2 bg-blue-100 text-blue-800">🎯 Optimized</Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL', 'MongoDB', 'Docker', 'Kubernetes'].map((skill, index) => (
                <Badge 
                  key={index} 
                  className={`${addedKeywords.includes(skill) ? 'bg-green-100 text-green-800 border-green-300 border' : 'bg-gray-100 text-gray-700'}`}
                >
                  {skill}
                  {addedKeywords.includes(skill) && <span className="ml-1">✨</span>}
                </Badge>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              Professional Experience
              <Badge className="ml-2 bg-purple-100 text-purple-800">📊 Quantified</Badge>
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900">Senior Software Engineer • TechStart Inc.</h4>
                <p className="text-sm text-gray-600 mb-2">2021 - Present</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Led development of <span className="bg-yellow-100 px-1 rounded font-semibold">React-based</span> dashboard, 
                    increasing user engagement by <span className="bg-yellow-100 px-1 rounded font-semibold">35%</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Architected <span className="bg-yellow-100 px-1 rounded font-semibold">Node.js</span> microservices on 
                    <span className="bg-yellow-100 px-1 rounded font-semibold"> AWS</span>, reducing response time by 
                    <span className="bg-yellow-100 px-1 rounded font-semibold">50%</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Mentored <span className="bg-yellow-100 px-1 rounded font-semibold">6 junior developers</span> and 
                    established code review processes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvements Made */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {improvements.map((improvement, index) => {
          const IconComponent = improvement.icon;
          return (
            <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
              <IconComponent className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{improvement.text}</span>
            </div>
          );
        })}
      </div>

      {/* Added Keywords */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Target className="h-4 w-4 mr-2 text-green-600" />
          Keywords Added for Better ATS Matching
        </h4>
        <div className="flex flex-wrap gap-2">
          {addedKeywords.map((keyword, index) => (
            <Badge key={index} className="bg-green-100 text-green-800 border-green-300 border">
              +{keyword}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TailoredResumePreview;
