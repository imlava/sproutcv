import React from 'react';
import { Card } from '@/components/ui/card';
import IssueCard from './IssueCard';
import { Issue } from './IssueTypes';

interface IssueCategoryPanelProps {
  title: string;
  issues: Issue[];
  onDismiss?: (id: string) => void;
  onExplain?: (issue: Issue) => void;
}

const IssueCategoryPanel: React.FC<IssueCategoryPanelProps> = ({ title, issues, onDismiss, onExplain }) => {
  if (!issues.length) return null;
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onDismiss={onDismiss} onExplain={onExplain} />)
        )}
      </div>
    </Card>
  );
};

export default IssueCategoryPanel;
