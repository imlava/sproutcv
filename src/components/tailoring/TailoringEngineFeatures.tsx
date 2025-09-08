import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  Zap, 
  BarChart3, 
  Edit3, 
  CheckCircle,
  TrendingUp,
  Award,
  Clock,
  Users
} from 'lucide-react';

const TailoringEngineFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: 'Keyword Match Analysis',
      description: 'AI identifies missing keywords and skill gaps',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Target,
      title: 'Gap Analysis',
      description: 'Highlights areas needing improvement',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Zap,
      title: 'One-Click Rewriting',
      description: 'Instantly improve content with AI suggestions',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: BarChart3,
      title: 'Achievement Quantification',
      description: 'Prompts to add metrics and numbers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Edit3,
      title: 'Tone & Readability',
      description: 'Optimizes writing style and clarity',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      icon: Award,
      title: 'ATS Optimization',
      description: 'Ensures compatibility with hiring systems',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="text-center">
            <div className={`p-3 ${feature.bgColor} rounded-lg w-fit mx-auto mb-3`}>
              <Icon className={`h-6 w-6 ${feature.color}`} />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-gray-600">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default TailoringEngineFeatures;
