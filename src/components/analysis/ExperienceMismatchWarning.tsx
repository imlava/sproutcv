
import React from 'react';
import { AlertTriangle, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExperienceMismatchWarningProps {
  warnings: string[];
  severity: 'none' | 'medium' | 'high';
  recommendedRoles: string[];
  onProceed: () => void;
  onViewBetterRoles: () => void;
}

const ExperienceMismatchWarning: React.FC<ExperienceMismatchWarningProps> = ({
  warnings,
  severity,
  recommendedRoles,
  onProceed,
  onViewBetterRoles
}) => {
  if (severity === 'none') return null;

  const getSeverityColor = () => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-orange-50 border-orange-200';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <Card className={`p-6 ${getSeverityColor()} border-2`}>
      <div className="flex items-start space-x-4">
        <AlertTriangle className={`h-8 w-8 ${getSeverityIcon()} flex-shrink-0 mt-1`} />
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {severity === 'high' ? 'Major Experience Mismatch' : 'Potential Experience Gap'}
            </h3>
            <Badge 
              className={
                severity === 'high' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-orange-100 text-orange-800'
              }
            >
              {severity.toUpperCase()} PRIORITY
            </Badge>
          </div>
          
          <div className="space-y-3 mb-6">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full ${getSeverityIcon().replace('text-', 'bg-')} mt-2 flex-shrink-0`} />
                <p className="text-gray-700 leading-relaxed">{warning}</p>
              </div>
            ))}
          </div>

          {recommendedRoles.length > 0 && (
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Better Matching Roles</h4>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {recommendedRoles.map((role, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800 border-green-300">
                    {role}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                These roles might be a better fit for your current experience level.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onViewBetterRoles}
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>View Better Matches</span>
            </Button>
            
            <Button 
              onClick={onProceed}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <span>Proceed Anyway</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            {severity === 'high' 
              ? 'We strongly recommend considering roles that better match your experience.'
              : 'Consider if this role aligns with your career goals before proceeding.'
            }
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ExperienceMismatchWarning;
