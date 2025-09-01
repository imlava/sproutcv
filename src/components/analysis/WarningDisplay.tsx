import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Eye, 
  Zap, 
  X, 
  HelpCircle,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import { Warning } from '@/types/validation';

interface WarningDisplayProps {
  warnings: Warning[];
  onDismiss: (warningId: string) => void;
  onAction: (warningId: string, action: string) => void;
}

export const WarningDisplay: React.FC<WarningDisplayProps> = ({
  warnings,
  onDismiss,
  onAction
}) => {
  const [expandedWarnings, setExpandedWarnings] = useState<string[]>([]);

  const handleExpand = (warningId: string) => {
    setExpandedWarnings(prev => 
      prev.includes(warningId) 
        ? prev.filter(id => id !== warningId)
        : [...prev, warningId]
    );
  };

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">Resume Analysis Alerts</h2>
        <Badge variant="outline" className="ml-auto">
          {warnings.length} {warnings.length === 1 ? 'Issue' : 'Issues'} Found
        </Badge>
      </div>

      {warnings.map(warning => (
        <WarningCard
          key={warning.id}
          warning={warning}
          isExpanded={expandedWarnings.includes(warning.id)}
          onExpand={() => handleExpand(warning.id)}
          onDismiss={() => onDismiss(warning.id)}
          onAction={(action) => onAction(warning.id, action)}
        />
      ))}

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          These alerts identify significant gaps that could impact your application success. 
          Review each item and take action to improve your match score.
        </AlertDescription>
      </Alert>
    </div>
  );
};

interface WarningCardProps {
  warning: Warning;
  isExpanded: boolean;
  onExpand: () => void;
  onDismiss: () => void;
  onAction: (action: string) => void;
}

const WarningCard: React.FC<WarningCardProps> = ({
  warning,
  isExpanded,
  onExpand,
  onDismiss,
  onAction
}) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'border-l-4 border-l-destructive bg-destructive/5';
      case 'MEDIUM':
        return 'border-l-4 border-l-warning bg-warning/5';
      case 'LOW':
        return 'border-l-4 border-l-muted-foreground bg-muted/5';
      default:
        return 'border-l-4 border-l-primary bg-primary/5';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'MEDIUM':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'LOW':
        return <Info className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getActionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Eye':
        return <Eye className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'X':
        return <X className="w-4 h-4" />;
      case 'Target':
        return <Target className="w-4 h-4" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4" />;
      case 'Award':
        return <Award className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`transition-all duration-200 ${getSeverityStyles(warning.severity)}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSeverityIcon(warning.severity)}
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {warning.title}
                <Badge variant={warning.severity === 'HIGH' ? 'destructive' : warning.severity === 'MEDIUM' ? 'secondary' : 'outline'}>
                  {warning.severity}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{warning.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {warning.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 space-y-6">
            {/* Explanation */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Why is this flagged?
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {warning.explanation}
              </p>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Impact Level
                </p>
                <p className="text-sm text-foreground">{warning.importance}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {warning.actions.map(action => (
                  <Button
                    key={action.id}
                    variant={action.type === 'primary' ? 'default' : action.type === 'destructive' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => onAction(action.id)}
                    className="flex items-center gap-2"
                  >
                    {getActionIcon(action.icon)}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Recommended Solutions</h4>
              <ul className="space-y-2">
                {warning.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            {warning.examples.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Examples</h4>
                <div className="space-y-4">
                  {warning.examples.map((example, index) => (
                    <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-3">
                      {example.context && (
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">
                          {example.context}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">❌ Before:</p>
                          <p className="text-sm text-foreground bg-destructive/10 p-2 rounded border-l-2 border-l-destructive">
                            {example.before}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">✅ After:</p>
                          <p className="text-sm text-foreground bg-success/10 p-2 rounded border-l-2 border-l-success">
                            {example.after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Criticality Score */}
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority Score</span>
                <span className="font-medium text-foreground">
                  {Math.round(warning.criticalityScore * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full mt-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-success to-warning"
                  style={{ width: `${warning.criticalityScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WarningDisplay;