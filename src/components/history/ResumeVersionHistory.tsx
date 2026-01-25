/**
 * Resume Version History Component
 * Displays and manages resume version history
 */

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  History,
  Clock,
  MoreVertical,
  Eye,
  RotateCcw,
  Trash2,
  Edit2,
  Tag,
  Download,
  Upload,
  GitCompare,
  Search,
  Filter,
  Save,
  FileText,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  ResumeVersion,
  resumeVersionService,
} from '@/services/history/ResumeVersionService';
import { format, formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeVersionHistoryProps {
  resumeId: string;
  currentContent?: string;
  onRestore?: (version: ResumeVersion) => void;
  onCompare?: (versionId1: string, versionId2: string) => void;
  onSaveVersion?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ResumeVersionHistory: React.FC<ResumeVersionHistoryProps> = ({
  resumeId,
  currentContent,
  onRestore,
  onCompare,
  onSaveVersion,
}) => {
  // State
  const [versions, setVersions] = useState<ResumeVersion[]>(() => 
    resumeVersionService.getVersions(resumeId)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    versions.forEach(v => v.metadata.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [versions]);

  // Filter versions
  const filteredVersions = useMemo(() => {
    return versions.filter(v => {
      const matchesSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.metadata.changeDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.metadata.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.metadata.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = !filterTag || v.metadata.tags?.includes(filterTag);
      
      return matchesSearch && matchesTag;
    });
  }, [versions, searchTerm, filterTag]);

  // Refresh versions
  const refreshVersions = () => {
    setVersions(resumeVersionService.getVersions(resumeId));
  };

  // Handle restore
  const handleRestore = (version: ResumeVersion) => {
    const restoredVersion = resumeVersionService.restoreVersion(resumeId, version.id);
    if (restoredVersion) {
      refreshVersions();
      onRestore?.(restoredVersion);
      toast.success('Version restored', {
        description: `Restored "${version.name}"`,
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (deleteVersionId) {
      resumeVersionService.deleteVersion(resumeId, deleteVersionId);
      refreshVersions();
      setDeleteVersionId(null);
      toast.success('Version deleted');
    }
  };

  // Handle rename
  const handleRename = () => {
    if (editingVersionId && editingName.trim()) {
      resumeVersionService.updateVersionName(resumeId, editingVersionId, editingName.trim());
      refreshVersions();
      setEditingVersionId(null);
      setEditingName('');
      toast.success('Version renamed');
    }
  };

  // Toggle version selection for comparison
  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  // Handle compare
  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompare?.(selectedVersions[0], selectedVersions[1]);
    }
  };

  // Export history
  const handleExportHistory = () => {
    const data = resumeVersionService.exportVersionHistory(resumeId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_history_${resumeId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('History exported');
  };

  // Import history
  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        if (resumeVersionService.importVersionHistory(resumeId, data)) {
          refreshVersions();
          toast.success('History imported');
        } else {
          toast.error('Failed to import history');
        }
      };
      reader.readAsText(file);
    }
  };

  // Storage usage
  const storageUsage = resumeVersionService.getStorageUsage();

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Version History</h2>
            <p className="text-sm text-gray-500">
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onSaveVersion && (
            <Button variant="outline" size="sm" onClick={onSaveVersion}>
              <Save className="h-4 w-4 mr-2" />
              Save Version
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportHistory}>
                <Download className="h-4 w-4 mr-2" />
                Export History
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import History
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportHistory}
                  />
                </label>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  resumeVersionService.deleteAllVersions(resumeId);
                  refreshVersions();
                  toast.success('All versions deleted');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search versions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterTag(null)}>
                All Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {allTags.map(tag => (
                <DropdownMenuItem key={tag} onClick={() => setFilterTag(tag)}>
                  <Tag className="h-4 w-4 mr-2" />
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Compare Action */}
      {selectedVersions.length === 2 && onCompare && (
        <div className="flex items-center justify-between p-3 mb-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            2 versions selected for comparison
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedVersions([])}>
              Clear
            </Button>
            <Button size="sm" onClick={handleCompare}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
      )}

      {/* Version List */}
      <ScrollArea className="h-[400px]">
        {filteredVersions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No versions found</p>
            {versions.length === 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Save your first version to start tracking changes
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVersions.map((version, index) => (
              <Card
                key={version.id}
                className={`p-4 transition-all cursor-pointer
                  ${selectedVersions.includes(version.id) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                  }
                  ${index === 0 ? 'border-primary/30' : ''}
                `}
                onClick={() => onCompare && toggleVersionSelection(version.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{version.name}</span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Latest</Badge>
                      )}
                      {version.metadata.isAutoSave && (
                        <Badge variant="outline" className="text-xs">Auto-save</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {version.metadata.wordCount} words
                      </span>
                      {version.metadata.atsScore && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          ATS: {version.metadata.atsScore}%
                        </span>
                      )}
                    </div>

                    {(version.metadata.jobTitle || version.metadata.companyName) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Target className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {version.metadata.jobTitle}
                          {version.metadata.companyName && ` at ${version.metadata.companyName}`}
                        </span>
                      </div>
                    )}

                    {version.metadata.changeDescription && (
                      <p className="text-xs text-gray-500 mt-2">
                        {version.metadata.changeDescription}
                      </p>
                    )}

                    {version.metadata.tags && version.metadata.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {version.metadata.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setPreviewVersion(version);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version);
                      }}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingVersionId(version.id);
                        setEditingName(version.name);
                      }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteVersionId(version.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Storage Usage */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Storage used</span>
          <span>{(storageUsage.used / 1024).toFixed(1)} KB / {(storageUsage.max / 1024 / 1024).toFixed(0)} MB</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              storageUsage.percentage > 80 ? 'bg-red-500' :
              storageUsage.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!editingVersionId} onOpenChange={() => setEditingVersionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Version</DialogTitle>
            <DialogDescription>
              Give this version a descriptive name to find it later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="Version name"
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVersionId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVersionId} onOpenChange={() => setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This version will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewVersion?.name}</DialogTitle>
            <DialogDescription>
              Created {previewVersion && format(new Date(previewVersion.createdAt), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            <div className="space-y-4">
              {previewVersion?.sections.map(section => (
                <div key={section.id} className="border-b pb-4">
                  <h3 className="font-bold text-gray-800 mb-2">{section.name}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
              Close
            </Button>
            {previewVersion && (
              <Button onClick={() => {
                handleRestore(previewVersion);
                setPreviewVersion(null);
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ResumeVersionHistory;
