/**
 * Resume Studio Component
 * Unified workspace integrating all resume features:
 * - PDF/Document Export
 * - Version History
 * - Side-by-Side Comparison
 * - Real-time Editing
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  History,
  GitCompare,
  Edit3,
  Save,
  Sparkles,
  Target,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Clock,
  Check,
  RefreshCw,
  Palette,
} from 'lucide-react';

// Services
import {
  resumeExportService,
  ResumeData,
  ExportOptions,
} from '@/services/export/ResumeExportService';
import {
  resumeVersionService,
  ResumeVersion,
  ResumeSection as VersionSection,
} from '@/services/history/ResumeVersionService';

// Components
import ResumeExportPanel from '@/components/export/ResumeExportPanel';
import ResumeVersionHistory from '@/components/history/ResumeVersionHistory';
import ResumeVersionComparison from '@/components/comparison/ResumeVersionComparison';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeStudioProps {
  initialData?: ResumeData;
  resumeId?: string;
  onSave?: (data: ResumeData) => void;
  className?: string;
}

interface Section {
  id: string;
  name: string;
  content: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ResumeStudio: React.FC<ResumeStudioProps> = ({
  initialData,
  resumeId = 'default-resume',
  onSave,
  className = '',
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'edit' | 'export' | 'history' | 'compare'>('edit');
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [linkedin, setLinkedin] = useState(initialData?.linkedin || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || '');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [sections, setSections] = useState<Section[]>(
    initialData?.sections || [
      { id: '1', name: 'Professional Summary', content: '' },
      { id: '2', name: 'Experience', content: '' },
      { id: '3', name: 'Education', content: '' },
      { id: '4', name: 'Skills', content: '' },
    ]
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonVersions, setComparisonVersions] = useState<[string, string] | null>(null);

  // Computed resume data
  const resumeData: ResumeData = useMemo(() => ({
    name,
    email,
    phone,
    location,
    linkedin,
    website,
    jobTitle,
    companyName,
    sections,
  }), [name, email, phone, location, linkedin, website, jobTitle, companyName, sections]);

  // Get word count
  const wordCount = useMemo(() => {
    const allText = [name, jobTitle, ...sections.map(s => s.content)].join(' ');
    return allText.split(/\s+/).filter(w => w).length;
  }, [name, jobTitle, sections]);

  // Handle section update
  const updateSection = useCallback((id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
  }, []);

  // Add new section
  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      content: '',
    };
    setSections(prev => [...prev, newSection]);
    setHasUnsavedChanges(true);
    toast.success('Section added');
  }, []);

  // Remove section
  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setHasUnsavedChanges(true);
    toast.success('Section removed');
  }, []);

  // Move section
  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return newSections;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Save version
  const saveVersion = useCallback((versionName?: string) => {
    const content = sections.map(s => `${s.name}\n${s.content}`).join('\n\n');
    const versionSections: VersionSection[] = sections.map(s => ({
      id: s.id,
      name: s.name,
      content: s.content,
    }));

    resumeVersionService.createVersion(
      resumeId,
      content,
      versionSections,
      {
        jobTitle,
        companyName,
        wordCount,
        characterCount: content.length,
        changeDescription: hasUnsavedChanges ? 'Manual save' : undefined,
      },
      versionName
    );

    setHasUnsavedChanges(false);
    setLastSaved(new Date());
    toast.success('Version saved!');
    
    onSave?.(resumeData);
  }, [resumeId, sections, jobTitle, companyName, wordCount, hasUnsavedChanges, onSave, resumeData]);

  // Restore version
  const handleRestore = useCallback((version: ResumeVersion) => {
    setSections(version.sections);
    if (version.metadata.jobTitle) setJobTitle(version.metadata.jobTitle);
    if (version.metadata.companyName) setCompanyName(version.metadata.companyName);
    setHasUnsavedChanges(true);
    toast.success(`Restored: ${version.name}`);
  }, []);

  // Open comparison
  const handleCompare = useCallback((versionId1: string, versionId2: string) => {
    setComparisonVersions([versionId1, versionId2]);
    setShowComparison(true);
  }, []);

  // Quick export
  const handleQuickExport = useCallback(async (format: 'pdf' | 'docx' | 'txt') => {
    try {
      if (format === 'txt') {
        const text = resumeExportService.exportToText(resumeData);
        resumeExportService.download(text, `${name || 'resume'}.txt`, 'text/plain');
      } else {
        await resumeExportService.export(resumeData, format, { template: 'professional' });
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  }, [resumeData, name]);

  // Auto-save schedule
  React.useEffect(() => {
    if (hasUnsavedChanges) {
      const content = sections.map(s => `${s.name}\n${s.content}`).join('\n\n');
      resumeVersionService.scheduleAutoSave(
        resumeId,
        content,
        sections,
        { jobTitle, companyName },
        60000 // Auto-save after 1 minute of inactivity
      );
    }
  }, [hasUnsavedChanges, resumeId, sections, jobTitle, companyName]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 ${className}`}>
      {/* Header - SproutCV Branded */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Resume Studio
                </h1>
              </div>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  Unsaved changes
                </Badge>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Saved
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{wordCount} words</span>
              <Separator orientation="vertical" className="h-6" />
              
              {/* Quick Export Buttons */}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleQuickExport('pdf')} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickExport('txt')} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  TXT
                </Button>
              </div>
              
              <Button 
                onClick={() => saveVersion()} 
                disabled={!hasUnsavedChanges}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Version
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto mb-6 bg-white/80 border border-green-200 p-1 rounded-xl">
            <TabsTrigger value="edit" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg">
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Personal Info */}
              <Card className="p-6 border-green-100 bg-white/80 backdrop-blur-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Personal Info
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jobTitle">Target Position</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => { setJobTitle(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName">Target Company</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="Tech Corp"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="555-1234"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="New York, NY"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => { setLinkedin(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => { setWebsite(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="johndoe.com"
                    />
                  </div>
                </div>
              </Card>

              {/* Center: Sections */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Resume Sections
                  </h2>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Section
                  </Button>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <Card key={section.id} className="p-4 border-l-4 border-l-primary/30">
                        <div className="flex items-center gap-2 mb-3">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          <Input
                            value={section.name}
                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                            className="font-medium flex-1"
                            placeholder="Section Name"
                          />
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => removeSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          placeholder={`Enter your ${section.name.toLowerCase()} content here...

Use bullet points (•) for lists:
• Achievement or responsibility
• Another point with metrics

Tip: Include quantifiable achievements when possible!`}
                          className="min-h-[150px] resize-none"
                        />
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>{section.content.split(/\s+/).filter(w => w).length} words</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="max-w-3xl mx-auto">
              <ResumeExportPanel
                resumeData={resumeData}
                onExportComplete={(format) => {
                  toast.success(`Resume exported as ${format.toUpperCase()}`);
                }}
              />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="max-w-3xl mx-auto">
              <ResumeVersionHistory
                resumeId={resumeId}
                currentContent={sections.map(s => `${s.name}\n${s.content}`).join('\n\n')}
                onRestore={handleRestore}
                onCompare={handleCompare}
                onSaveVersion={() => saveVersion()}
              />
            </div>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare">
            <div className="max-w-6xl mx-auto">
              <ResumeVersionComparison
                resumeId={resumeId}
                initialOldVersionId={comparisonVersions?.[0]}
                initialNewVersionId={comparisonVersions?.[1]}
                onRestore={handleRestore}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 shadow-lg"
            size="lg"
          >
            <Eye className="h-5 w-5 mr-2" />
            Preview
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[600px] sm:w-[800px] overflow-auto">
          <SheetHeader>
            <SheetTitle>Resume Preview</SheetTitle>
            <SheetDescription>
              Preview how your resume will look when exported
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Card className="p-8 bg-white shadow-inner">
              {/* Preview Content */}
              <div className="font-serif">
                <h1 className="text-2xl font-bold text-center">{name || 'Your Name'}</h1>
                {jobTitle && <p className="text-center text-gray-600 mt-1">{jobTitle}</p>}
                
                <div className="flex justify-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                  {email && <span>{email}</span>}
                  {phone && <span>{phone}</span>}
                  {location && <span>{location}</span>}
                </div>
                
                <Separator className="my-4" />
                
                {sections.map(section => (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-lg font-semibold uppercase tracking-wider border-b pb-1 mb-2">
                      {section.name}
                    </h2>
                    <div className="text-sm whitespace-pre-wrap">
                      {section.content || <span className="text-gray-400 italic">No content yet</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ResumeStudio;
