export type Severity = 'critical' | 'urgent' | 'optional';

export interface Issue {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g., 'relevance', 'impact', 'ats', 'skills', 'experience', 'education'
  severity: Severity;
  why: string;
  howToImprove?: string;
  source?: string; // where this issue originated from
}

export const categoryLabels: Record<string, string> = {
  relevance: 'Relevance',
  impact: 'Impact & Achievements',
  experience: 'Experience',
  skills: 'Skills Alignment',
  ats: 'ATS Compatibility',
  education: 'Education',
};

export const severityToBadge: Record<Severity, 'default' | 'secondary' | 'destructive'> = {
  critical: 'destructive',
  urgent: 'default',
  optional: 'secondary',
};
