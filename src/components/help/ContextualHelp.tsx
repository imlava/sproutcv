import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  HelpCircle, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';
import { Warning } from '@/types/validation';

interface ContextualHelpProps {
  warning: Warning;
  children?: React.ReactNode;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ 
  warning, 
  children 
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-destructive';
      case 'MEDIUM':
        return 'text-warning';
      case 'LOW':
        return 'text-muted-foreground';
      default:
        return 'text-primary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'MEDIUM':
        return <Info className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      case 'LOW':
        return <CheckCircle className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
      default:
        return <Info className={`w-5 h-5 ${getSeverityColor(severity)}`} />;
    }
  };

  const getImpactLevel = (criticality: number) => {
    if (criticality >= 0.8) return { label: 'Critical', color: 'destructive' };
    if (criticality >= 0.6) return { label: 'High Impact', color: 'warning' };
    if (criticality >= 0.4) return { label: 'Medium Impact', color: 'secondary' };
    return { label: 'Low Impact', color: 'outline' };
  };

  const impactLevel = getImpactLevel(warning.criticalityScore);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getSeverityIcon(warning.severity)}
            <span>{warning.title}</span>
            <Badge variant={impactLevel.color as any} className="ml-auto">
              {impactLevel.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card className="p-4 bg-muted/30">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {warning.description}
              </p>
            </div>
          </Card>

          {/* Why This Matters */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Why This Matters</h3>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {warning.explanation}
              </p>
              <div className="mt-3 pt-3 border-t border-primary/20">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                  Business Impact
                </p>
                <p className="text-sm text-muted-foreground">
                  {warning.importance}
                </p>
              </div>
            </div>
          </section>

          {/* How to Fix */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-foreground">How to Fix</h3>
            </div>
            <div className="space-y-3">
              {warning.solutions.map((solution, index) => (
                <div key={index} className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-lg p-3">
                  <div className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    {solution}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          {warning.examples.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-foreground">Examples</h3>
              </div>
              <div className="space-y-4">
                {warning.examples.map((example, index) => (
                  <Card key={index} className="p-4">
                    {example.context && (
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs">
                          {example.context}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <p className="text-sm font-medium text-muted-foreground">
                            Before (Weak)
                          </p>
                        </div>
                        <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                          <p className="text-sm text-foreground leading-relaxed">
                            {example.before}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-success rounded-full" />
                          <p className="text-sm font-medium text-muted-foreground">
                            After (Strong)
                          </p>
                        </div>
                        <div className="bg-success/10 border border-success/20 rounded p-3">
                          <p className="text-sm text-foreground leading-relaxed">
                            {example.after}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Best Practices */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Best Practices</h3>
            </div>
            <Card className="p-4 bg-primary/5 border-primary/20">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  Use specific, measurable achievements whenever possible
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  Include keywords naturally within context, not as lists
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  Tailor your resume for each specific job application
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  Use action verbs and quantify results when possible
                </li>
              </ul>
            </Card>
          </section>

          {/* Priority Score */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">Priority Level</h3>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Criticality Score</span>
                <span className="font-bold text-foreground">
                  {Math.round(warning.criticalityScore * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-success via-warning to-destructive transition-all duration-300"
                  style={{ width: `${warning.criticalityScore * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Higher scores indicate more critical issues that should be addressed first
              </p>
            </Card>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextualHelp;