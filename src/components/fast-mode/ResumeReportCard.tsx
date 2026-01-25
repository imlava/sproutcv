/**
 * Resume Report Card Component
 * Displays visual scores with animated reveals
 * Categories: ATS, Keywords, Impact, Format
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Key,
  TrendingUp,
  Layout,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AnalysisScores {
  atsCompatibility: number;
  keywordMatch: number;
  impactScore: number;
  formatQuality: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number;
}

interface ResumeReportCardProps {
  scores: AnalysisScores;
  isImproved?: boolean;
}

interface ScoreCategory {
  id: string;
  name: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const ResumeReportCard: React.FC<ResumeReportCardProps> = ({ scores, isImproved = false }) => {
  const [animatedScores, setAnimatedScores] = useState({
    atsCompatibility: 0,
    keywordMatch: 0,
    impactScore: 0,
    formatQuality: 0,
    overallScore: 0,
  });
  const [showGrade, setShowGrade] = useState(false);

  // Animate scores on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

      setAnimatedScores({
        atsCompatibility: Math.round(scores.atsCompatibility * easeOut),
        keywordMatch: Math.round(scores.keywordMatch * easeOut),
        impactScore: Math.round(scores.impactScore * easeOut),
        formatQuality: Math.round(scores.formatQuality * easeOut),
        overallScore: Math.round(scores.overallScore * easeOut),
      });

      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => setShowGrade(true), 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [scores]);

  // Get grade color
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'from-green-500 to-emerald-500';
      case 'B': return 'from-blue-500 to-cyan-500';
      case 'C': return 'from-yellow-500 to-amber-500';
      case 'D': return 'from-orange-500 to-red-400';
      case 'F': return 'from-red-500 to-red-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  // Get score color class
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get progress color
  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Score categories
  const categories: ScoreCategory[] = [
    {
      id: 'ats',
      name: 'ATS Compatibility',
      score: animatedScores.atsCompatibility,
      icon: <Shield className="h-5 w-5" />,
      description: 'How well your resume parses in applicant tracking systems',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      id: 'keywords',
      name: 'Keyword Match',
      score: animatedScores.keywordMatch,
      icon: <Key className="h-5 w-5" />,
      description: 'Relevant industry and job-specific keywords found',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      id: 'impact',
      name: 'Impact Score',
      score: animatedScores.impactScore,
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Quantified achievements and action-oriented language',
      color: 'text-orange-600 bg-orange-100',
    },
    {
      id: 'format',
      name: 'Format Quality',
      score: animatedScores.formatQuality,
      icon: <Layout className="h-5 w-5" />,
      description: 'Structure, readability, and professional formatting',
      color: 'text-green-600 bg-green-100',
    },
  ];

  // Get status badge
  const getStatusBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> };
    if (score >= 60) return { text: 'Good', variant: 'secondary' as const, icon: <Info className="h-3 w-3" /> };
    if (score >= 40) return { text: 'Needs Work', variant: 'outline' as const, icon: <AlertTriangle className="h-3 w-3" /> };
    return { text: 'Critical', variant: 'destructive' as const, icon: <AlertTriangle className="h-3 w-3" /> };
  };

  return (
    <Card className="p-6 overflow-hidden relative">
      {/* Improved Badge */}
      {isImproved && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Improved
          </Badge>
        </div>
      )}

      {/* Header with Overall Grade */}
      <div className="flex items-start gap-6 mb-6">
        {/* Grade Circle */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getGradeColor(scores.overallGrade)} flex items-center justify-center shadow-lg transform transition-all duration-500 ${showGrade ? 'scale-100 rotate-0' : 'scale-50 rotate-12'}`}>
            <span className="text-4xl font-bold text-white">
              {showGrade ? scores.overallGrade : '?'}
            </span>
          </div>
          {showGrade && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
              <Award className={`h-5 w-5 ${scores.overallGrade === 'A' ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
          )}
        </div>

        {/* Overall Info */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Resume Report Card</h2>
          <p className="text-gray-600 text-sm mb-3">
            {scores.overallGrade === 'A' && "Outstanding! Your resume is highly competitive."}
            {scores.overallGrade === 'B' && "Good foundation with room for improvement."}
            {scores.overallGrade === 'C' && "Average resume - improvements recommended."}
            {scores.overallGrade === 'D' && "Below average - significant changes needed."}
            {scores.overallGrade === 'F' && "Needs major revision to be competitive."}
          </p>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-gray-900">{animatedScores.overallScore}</span>
              <span className="text-gray-500 text-sm">/100</span>
            </div>
            <div className="flex-1 max-w-32">
              <Progress 
                value={animatedScores.overallScore} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const status = getStatusBadge(category.score);
          
          return (
            <div key={category.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <Badge variant={status.variant} className="text-xs py-0">
                        {status.icon}
                        <span className="ml-1">{status.text}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                  {category.score}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 ${getProgressColor(category.score)} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${category.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Tips */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          💡 Apply the suggested improvements to boost your score by up to 20 points
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Powered by SproutCV AI
        </p>
      </div>
    </Card>
  );
};

export default ResumeReportCard;
