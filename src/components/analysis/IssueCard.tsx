import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { Issue, severityToBadge } from './IssueTypes';

interface IssueCardProps {
  issue: Issue;
  onDismiss?: (id: string) => void;
  onExplain?: (issue: Issue) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onDismiss, onExplain }) => {
  const [showWhy, setShowWhy] = useState(false);
  const [showHow, setShowHow] = useState(!!issue.howToImprove);

  return (
    <Card className="p-4 border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={severityToBadge[issue.severity]} className="capitalize text-xs">
              {issue.severity}
            </Badge>
            <h4 className="font-medium text-base">{issue.title}</h4>
          </div>
          {issue.description && (
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          )}
        </div>
        {onDismiss && (
          <Button size="icon" variant="ghost" onClick={() => onDismiss(issue.id)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowWhy(v => !v)}>
          {showWhy ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          Learn why this matters
        </Button>
        {issue.howToImprove && (
          <Button variant="secondary" size="sm" onClick={() => setShowHow(v => !v)}>
            {showHow ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            How to improve
          </Button>
        )}
        {onExplain && (
          <Button variant="ghost" size="sm" onClick={() => onExplain(issue)}>
            <Info className="h-4 w-4 mr-1" />
            Ask for explanation
          </Button>
        )}
      </div>

      {showWhy && (
        <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
          {issue.why}
        </div>
      )}

      {showHow && issue.howToImprove && (
        <div className="mt-3 p-3 rounded-md bg-primary/5 text-sm">
          {issue.howToImprove}
        </div>
      )}
    </Card>
  );
};

export default IssueCard;
