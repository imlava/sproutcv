/**
 * Quick Improvements Component
 * Displays AI-suggested improvements with one-click apply
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Zap,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface Improvement {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  original: string;
  improved: string;
  impact: string;
  applied: boolean;
}

interface QuickImprovementsProps {
  improvements: Improvement[];
  onApplyImprovement: (id: string) => void;
  onApplyAll: () => void;
  isApplying?: boolean;
}

const QuickImprovements: React.FC<QuickImprovementsProps> = ({
  improvements,
  onApplyImprovement,
  onApplyAll,
  isApplying = false,
}) => {
  const appliedCount = improvements.filter(i => i.applied).length;
  const totalCount = improvements.length;
  const allApplied = appliedCount === totalCount;

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200',
          icon: <AlertTriangle className="h-3 w-3" />,
          border: 'border-l-red-500',
        };
      case 'medium':
        return {
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: <Info className="h-3 w-3" />,
          border: 'border-l-yellow-500',
        };
      case 'low':
        return {
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <TrendingUp className="h-3 w-3" />,
          border: 'border-l-blue-500',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: null,
          border: 'border-l-gray-400',
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'impact':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'keywords':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'ats':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'format':
        return <Zap className="h-4 w-4 text-green-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Improvements
          </h2>
          <p className="text-sm text-gray-600">
            {appliedCount}/{totalCount} improvements applied
          </p>
        </div>
        
        {!allApplied && (
          <Button
            onClick={onApplyAll}
            disabled={isApplying}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Apply All
              </>
            )}
          </Button>
        )}
        
        {allApplied && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            All Applied
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(appliedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Improvements List */}
      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div className="space-y-3">
          {improvements.map((improvement) => {
            const priorityStyle = getPriorityStyle(improvement.priority);
            
            return (
              <div
                key={improvement.id}
                className={`p-4 rounded-lg border-l-4 ${priorityStyle.border} ${
                  improvement.applied 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                } transition-all duration-300`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(improvement.category)}
                    <span className="font-medium text-gray-900">{improvement.category}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${priorityStyle.badge}`}
                    >
                      {priorityStyle.icon}
                      <span className="ml-1 capitalize">{improvement.priority}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      {improvement.impact}
                    </Badge>
                    <Checkbox
                      checked={improvement.applied}
                      onCheckedChange={() => onApplyImprovement(improvement.id)}
                      disabled={isApplying}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                </div>

                {/* Before/After */}
                <div className="space-y-2">
                  {/* Original */}
                  <div className={`text-sm ${improvement.applied ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    <span className="text-xs font-medium text-red-500 mr-2">Before:</span>
                    "{improvement.original}"
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className={`h-4 w-4 ${improvement.applied ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  
                  {/* Improved */}
                  <div className={`text-sm ${improvement.applied ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    <span className="text-xs font-medium text-green-500 mr-2">After:</span>
                    "{improvement.improved}"
                  </div>
                </div>

                {/* Applied Badge */}
                {improvement.applied && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Applied to your resume</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          ✨ Each improvement is tailored to increase your resume's effectiveness
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          AI-powered by SproutCV
        </p>
      </div>
    </Card>
  );
};

export default QuickImprovements;
