/**
 * Resume Export Panel Component
 * Allows users to export their tailored resume in various formats
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  FileType,
  FileJson,
  FileCode,
  Printer,
  Eye,
  Settings2,
  Palette,
  Type,
  Layout,
  Check,
  Loader2,
} from 'lucide-react';
import { 
  resumeExportService, 
  ResumeData, 
  ExportOptions, 
  ExportFormat 
} from '@/services/export/ResumeExportService';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeExportPanelProps {
  resumeData: ResumeData;
  onExportComplete?: (format: ExportFormat) => void;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  isRecommended?: boolean;
}

// ============================================================================
// OPTIONS
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Best for submitting applications',
    icon: <FileText className="h-5 w-5" />,
    isRecommended: true,
  },
  {
    id: 'docx',
    name: 'Word (DOCX)',
    description: 'Editable in Microsoft Word',
    icon: <FileType className="h-5 w-5" />,
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'For ATS systems and copying',
    icon: <FileCode className="h-5 w-5" />,
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web-ready format',
    icon: <FileCode className="h-5 w-5" />,
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'For backups and imports',
    icon: <FileJson className="h-5 w-5" />,
  },
];

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, traditional style',
    preview: '🏢',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary with accent colors',
    preview: '✨',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless, centered layout',
    preview: '📜',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, whitespace-focused',
    preview: '⚪',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Sophisticated for senior roles',
    preview: '💼',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ResumeExportPanel: React.FC<ResumeExportPanelProps> = ({
  resumeData,
  onExportComplete,
}) => {
  // State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('professional');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [margins, setMargins] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [includeDate, setIncludeDate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        template: selectedTemplate as any,
        fontSize,
        margins,
        includeDate,
      };

      const result = await resumeExportService.export(resumeData, selectedFormat, options);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const name = resumeData.name?.replace(/\s+/g, '_') || 'resume';
      const company = resumeData.companyName?.replace(/\s+/g, '_') || '';
      const filename = company 
        ? `${name}_${company}_${timestamp}`
        : `${name}_${timestamp}`;

      // Get mime type and extension
      const mimeTypes: Record<ExportFormat, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
        html: 'text/html',
        json: 'application/json',
      };

      // Download
      resumeExportService.download(
        result,
        `${filename}.${selectedFormat}`,
        mimeTypes[selectedFormat]
      );

      toast.success(`Resume exported as ${selectedFormat.toUpperCase()}!`, {
        description: 'Check your downloads folder.',
      });

      onExportComplete?.(selectedFormat);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    try {
      const options: ExportOptions = {
        template: selectedTemplate as any,
        fontSize,
        margins,
        includeDate,
      };

      const html = resumeExportService.exportToHTML(resumeData, options);
      
      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(html);
        previewWindow.document.close();
      }
    } catch (error) {
      toast.error('Preview failed', {
        description: 'Unable to generate preview.',
      });
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Export Resume</h2>
          <p className="text-sm text-gray-500">Download your tailored resume</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Export Format</Label>
          <RadioGroup
            value={selectedFormat}
            onValueChange={(v) => setSelectedFormat(v as ExportFormat)}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {FORMAT_OPTIONS.map((option) => (
              <div key={option.id}>
                <RadioGroupItem
                  value={option.id}
                  id={`format-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`format-${option.id}`}
                  className="flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                    peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2
                    peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                    hover:bg-gray-50"
                >
                  <div className={`mb-2 ${selectedFormat === option.id ? 'text-primary' : 'text-gray-500'}`}>
                    {option.icon}
                  </div>
                  <span className="font-medium text-sm">{option.name}</span>
                  {option.isRecommended && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Recommended
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Template Selection (only for PDF/DOCX/HTML) */}
        {['pdf', 'docx', 'html'].includes(selectedFormat) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium">Template Style</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 text-center transition-all
                    ${selectedTemplate === template.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-2xl mb-2">{template.preview}</div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        {['pdf', 'docx', 'html'].includes(selectedFormat) && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-start"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {/* Advanced Options */}
            {showAdvanced && (
              <Card className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Font Size */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="h-4 w-4 text-gray-500" />
                      <Label className="text-sm">Font Size</Label>
                    </div>
                    <Select value={fontSize} onValueChange={(v) => setFontSize(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (10pt)</SelectItem>
                        <SelectItem value="medium">Medium (11pt)</SelectItem>
                        <SelectItem value="large">Large (12pt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Margins */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="h-4 w-4 text-gray-500" />
                      <Label className="text-sm">Margins</Label>
                    </div>
                    <Select value={margins} onValueChange={(v) => setMargins(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="narrow">Narrow (0.5")</SelectItem>
                        <SelectItem value="normal">Normal (0.75")</SelectItem>
                        <SelectItem value="wide">Wide (1")</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Include Date */}
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="include-date"
                      checked={includeDate}
                      onCheckedChange={(checked) => setIncludeDate(!!checked)}
                    />
                    <Label htmlFor="include-date" className="text-sm cursor-pointer">
                      Include generation date
                    </Label>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        <Separator />

        {/* Resume Preview Info */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">Resume Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <div className="font-medium">{resumeData.name || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-gray-500">Sections:</span>
              <div className="font-medium">{resumeData.sections.length} sections</div>
            </div>
            <div>
              <span className="text-gray-500">Target:</span>
              <div className="font-medium">{resumeData.companyName || 'General'}</div>
            </div>
            <div>
              <span className="text-gray-500">Position:</span>
              <div className="font-medium">{resumeData.jobTitle || 'Not specified'}</div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          {['pdf', 'docx', 'html'].includes(selectedFormat) && (
            <>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  await handleExport();
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </>
          )}
        </div>

        {/* Format-specific notes */}
        <div className="text-xs text-gray-500 space-y-1">
          {selectedFormat === 'pdf' && (
            <p>💡 PDF format is recommended for job applications. Use your browser's print dialog to save as PDF.</p>
          )}
          {selectedFormat === 'docx' && (
            <p>💡 Word format allows you to make further edits. The file can be opened in Microsoft Word or Google Docs.</p>
          )}
          {selectedFormat === 'txt' && (
            <p>💡 Plain text is ideal for copying into online application forms and ensuring ATS compatibility.</p>
          )}
          {selectedFormat === 'html' && (
            <p>💡 HTML format can be used for creating an online resume or portfolio website.</p>
          )}
          {selectedFormat === 'json' && (
            <p>💡 JSON format is useful for backing up your resume data or importing into other tools.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResumeExportPanel;
