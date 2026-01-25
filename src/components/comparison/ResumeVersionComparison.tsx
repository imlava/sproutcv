/**
 * Resume Version Comparison Component
 * Side-by-side comparison of two resume versions with diff highlighting
 */

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitCompare,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
  History,
  Check,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus as MinusIcon
} from 'lucide-react';
import { 
  ResumeVersion, 
  VersionComparison, 
  VersionDiff,
  resumeVersionService 
} from '@/services/history/ResumeVersionService';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeVersionComparisonProps {
  resumeId: string;
  versions?: ResumeVersion[];
  initialOldVersionId?: string;
  initialNewVersionId?: string;
  onRestore?: (version: ResumeVersion) => void;
  onClose?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function highlightDiff(oldText: string, newText: string): {
  oldHighlighted: React.ReactNode[];
  newHighlighted: React.ReactNode[];
} {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const oldSet = new Set(oldLines.map(l => l.trim()));
  const newSet = new Set(newLines.map(l => l.trim()));

  const oldHighlighted = oldLines.map((line, idx) => {
    const trimmed = line.trim();
    if (!newSet.has(trimmed) && trimmed) {
      return (
        <div key={idx} className="bg-red-100 border-l-4 border-red-500 px-2 py-0.5">
          <span className="text-red-700">{line || ' '}</span>
        </div>
      );
    }
    return (
      <div key={idx} className="px-2 py-0.5">
        <span className="text-gray-700">{line || ' '}</span>
      </div>
    );
  });

  const newHighlighted = newLines.map((line, idx) => {
    const trimmed = line.trim();
    if (!oldSet.has(trimmed) && trimmed) {
      return (
        <div key={idx} className="bg-green-100 border-l-4 border-green-500 px-2 py-0.5">
          <span className="text-green-700">{line || ' '}</span>
        </div>
      );
    }
    return (
      <div key={idx} className="px-2 py-0.5">
        <span className="text-gray-700">{line || ' '}</span>
      </div>
    );
  });

  return { oldHighlighted, newHighlighted };
}

// ============================================================================
// COMPONENT
// ============================================================================

const ResumeVersionComparison: React.FC<ResumeVersionComparisonProps> = ({
  resumeId,
  versions: providedVersions,
  initialOldVersionId,
  initialNewVersionId,
  onRestore,
  onClose,
}) => {
  // State
  const versions = providedVersions || resumeVersionService.getVersions(resumeId);
  const [oldVersionId, setOldVersionId] = useState<string>(
    initialOldVersionId || (versions[1]?.id || '')
  );
  const [newVersionId, setNewVersionId] = useState<string>(
    initialNewVersionId || (versions[0]?.id || '')
  );
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'sections'>('side-by-side');

  // Compute comparison
  const comparison = useMemo<VersionComparison | null>(() => {
    if (!oldVersionId || !newVersionId || oldVersionId === newVersionId) {
      return null;
    }
    return resumeVersionService.compareVersions(resumeId, oldVersionId, newVersionId);
  }, [resumeId, oldVersionId, newVersionId]);

  // Get versions
  const oldVersion = versions.find(v => v.id === oldVersionId);
  const newVersion = versions.find(v => v.id === newVersionId);

  // Swap versions
  const handleSwap = () => {
    const temp = oldVersionId;
    setOldVersionId(newVersionId);
    setNewVersionId(temp);
  };

  if (versions.length < 2) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Versions to Compare</h3>
          <p className="text-gray-500">
            You need at least 2 saved versions to compare. Make some changes and save to create versions.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitCompare className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Version Comparison</h2>
            <p className="text-sm text-gray-500">Compare different versions of your resume</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Version Selectors */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Old Version</label>
          <Select value={oldVersionId} onValueChange={setOldVersionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select old version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map(v => (
                <SelectItem key={v.id} value={v.id} disabled={v.id === newVersionId}>
                  <div className="flex items-center gap-2">
                    <span>{v.name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(v.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="sm" onClick={handleSwap} className="mt-5">
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 block">New Version</label>
          <Select value={newVersionId} onValueChange={setNewVersionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select new version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map(v => (
                <SelectItem key={v.id} value={v.id} disabled={v.id === oldVersionId}>
                  <div className="flex items-center gap-2">
                    <span>{v.name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(v.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison Summary */}
      {comparison && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{comparison.summary.totalChanges}</div>
            <div className="text-xs text-gray-600">Total Changes</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{comparison.summary.sectionsModified}</div>
            <div className="text-xs text-gray-600">Modified</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{comparison.summary.sectionsAdded}</div>
            <div className="text-xs text-gray-600">Added</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{comparison.summary.sectionsRemoved}</div>
            <div className="text-xs text-gray-600">Removed</div>
          </Card>
          <Card className="p-3 text-center">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              comparison.summary.wordCountChange > 0 ? 'text-green-600' : 
              comparison.summary.wordCountChange < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {comparison.summary.wordCountChange > 0 && <TrendingUp className="h-4 w-4" />}
              {comparison.summary.wordCountChange < 0 && <TrendingDown className="h-4 w-4" />}
              {comparison.summary.wordCountChange === 0 && <MinusIcon className="h-4 w-4" />}
              {Math.abs(comparison.summary.wordCountChange)}
            </div>
            <div className="text-xs text-gray-600">Word Change</div>
          </Card>
        </div>
      )}

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="unified">Unified</TabsTrigger>
          <TabsTrigger value="sections">By Section</TabsTrigger>
        </TabsList>

        {/* Side by Side View */}
        <TabsContent value="side-by-side">
          {comparison && oldVersion && newVersion && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2 p-2 bg-red-50 rounded-t-lg">
                  <span className="font-medium text-red-800">{oldVersion.name}</span>
                  <span className="text-xs text-red-600">
                    {oldVersion.metadata.wordCount} words
                  </span>
                </div>
                <ScrollArea className="h-[500px] border rounded-b-lg">
                  <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                    {comparison.diffs.map((diff, idx) => (
                      <div key={idx} className="mb-4">
                        <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                          {diff.sectionName}
                          {diff.type === 'removed' && <Badge variant="destructive" className="text-xs">Removed</Badge>}
                        </div>
                        {diff.oldContent && (
                          <div className="text-sm">
                            {highlightDiff(diff.oldContent, diff.newContent || '').oldHighlighted}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 p-2 bg-green-50 rounded-t-lg">
                  <span className="font-medium text-green-800">{newVersion.name}</span>
                  <span className="text-xs text-green-600">
                    {newVersion.metadata.wordCount} words
                  </span>
                </div>
                <ScrollArea className="h-[500px] border rounded-b-lg">
                  <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                    {comparison.diffs.map((diff, idx) => (
                      <div key={idx} className="mb-4">
                        <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                          {diff.sectionName}
                          {diff.type === 'added' && <Badge className="bg-green-600 text-xs">Added</Badge>}
                        </div>
                        {diff.newContent && (
                          <div className="text-sm">
                            {highlightDiff(diff.oldContent || '', diff.newContent).newHighlighted}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Unified View */}
        <TabsContent value="unified">
          {comparison && (
            <ScrollArea className="h-[600px] border rounded-lg">
              <div className="p-4">
                {comparison.diffs.map((diff, idx) => (
                  <div key={idx} className="mb-6 border-b pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-bold text-gray-800">{diff.sectionName}</span>
                      {diff.type === 'modified' && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                          Modified ({diff.changedPercentage}% changed)
                        </Badge>
                      )}
                      {diff.type === 'added' && (
                        <Badge className="bg-green-600">Added</Badge>
                      )}
                      {diff.type === 'removed' && (
                        <Badge variant="destructive">Removed</Badge>
                      )}
                      {diff.type === 'unchanged' && (
                        <Badge variant="secondary">Unchanged</Badge>
                      )}
                    </div>
                    
                    {diff.type === 'modified' && diff.oldContent && diff.newContent && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Changes:</div>
                        <div className="font-mono text-sm">
                          {diff.oldContent.split('\n').map((line, i) => {
                            const newLines = diff.newContent?.split('\n') || [];
                            if (!newLines.includes(line) && line.trim()) {
                              return (
                                <div key={`old-${i}`} className="bg-red-50 border-l-4 border-red-400 px-2 py-0.5">
                                  <span className="text-red-600">- {line}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                          {diff.newContent.split('\n').map((line, i) => {
                            const oldLines = diff.oldContent?.split('\n') || [];
                            if (!oldLines.includes(line) && line.trim()) {
                              return (
                                <div key={`new-${i}`} className="bg-green-50 border-l-4 border-green-400 px-2 py-0.5">
                                  <span className="text-green-600">+ {line}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {diff.type === 'added' && diff.newContent && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 font-mono text-sm text-green-700 whitespace-pre-wrap">
                        {diff.newContent}
                      </div>
                    )}
                    
                    {diff.type === 'removed' && diff.oldContent && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 font-mono text-sm text-red-700 whitespace-pre-wrap">
                        {diff.oldContent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Sections View */}
        <TabsContent value="sections">
          {comparison && (
            <div className="space-y-4">
              {comparison.diffs.map((diff, idx) => (
                <Card key={idx} className={`p-4 ${
                  diff.type === 'modified' ? 'border-yellow-200 bg-yellow-50/30' :
                  diff.type === 'added' ? 'border-green-200 bg-green-50/30' :
                  diff.type === 'removed' ? 'border-red-200 bg-red-50/30' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{diff.sectionName}</span>
                      {diff.type === 'modified' && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Modified
                        </Badge>
                      )}
                      {diff.type === 'added' && (
                        <Badge className="bg-green-600">
                          <Plus className="h-3 w-3 mr-1" />
                          Added
                        </Badge>
                      )}
                      {diff.type === 'removed' && (
                        <Badge variant="destructive">
                          <Minus className="h-3 w-3 mr-1" />
                          Removed
                        </Badge>
                      )}
                      {diff.type === 'unchanged' && (
                        <Badge variant="secondary">
                          <Check className="h-3 w-3 mr-1" />
                          Unchanged
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {diff.type === 'modified' && (
                        <span>
                          <span className="text-green-600">+{diff.addedLines}</span>
                          {' / '}
                          <span className="text-red-600">-{diff.removedLines}</span>
                          {' lines'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {diff.type !== 'unchanged' && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {diff.oldContent && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Before</div>
                          <div className="p-2 bg-white border rounded text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                            {diff.oldContent}
                          </div>
                        </div>
                      )}
                      {diff.newContent && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">After</div>
                          <div className="p-2 bg-white border rounded text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                            {diff.newContent}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {comparison && onRestore && (
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => oldVersion && onRestore(oldVersion)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Restore Old Version
          </Button>
          <Button
            variant="outline"
            onClick={() => newVersion && onRestore(newVersion)}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Restore New Version
          </Button>
        </div>
      )}

      {!comparison && oldVersionId && newVersionId && oldVersionId === newVersionId && (
        <Alert>
          <AlertDescription>
            Please select two different versions to compare.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};

export default ResumeVersionComparison;
