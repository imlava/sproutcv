
import React from 'react';
import { TrendingUp, Target, Zap, FileCheck, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreDashboardProps {
  overallScore: number;
  keywordMatch: number;
  skillsAlignment: number;
  atsCompatibility: number;
  experienceRelevance: number;
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  overallScore,
  keywordMatch,
  skillsAlignment,
  atsCompatibility,
  experienceRelevance
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const metrics = [
    { name: 'Keyword Match', score: keywordMatch, icon: Target, description: 'How well your resume matches job keywords' },
    { name: 'Skills Alignment', score: skillsAlignment, icon: Zap, description: 'Relevance of your skills to requirements' },
    { name: 'ATS Compatibility', score: atsCompatibility, icon: FileCheck, description: 'How well ATS systems will parse your resume' },
    { name: 'Experience Relevance', score: experienceRelevance, icon: TrendingUp, description: 'How your experience aligns with the role' }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-4">
            <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Overall Match Score</h3>
          <p className="text-gray-600">
            {overallScore >= 80 ? 'Excellent match! ' : overallScore >= 60 ? 'Good match with room for improvement. ' : 'Needs significant improvements. '}
            Your resume is {overallScore >= 80 ? 'well-optimized' : 'not fully optimized'} for this job.
          </p>
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{metric.name}</h4>
                    <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                      {metric.score}%
                    </span>
                  </div>
                  <Progress 
                    value={metric.score} 
                    className="mb-2 h-2"
                  />
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-800">Priority Improvements</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div>
              <p className="font-medium text-orange-800">Add key technical skills</p>
              <p className="text-sm text-orange-600">React, Node.js, AWS mentioned in job but missing from resume</p>
            </div>
            <button className="text-orange-600 hover:text-orange-700 font-medium">Fix</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-800">Quantify achievements</p>
              <p className="text-sm text-blue-600">Add metrics to 3 bullet points for stronger impact</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">Fix</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScoreDashboard;
