import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DocumentProcessor } from '@/services/document/DocumentProcessor';
import { 
  Upload, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Palette,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Copy,
  X
} from 'lucide-react';

interface BuildProfileStepProps {
  state: {
    resume: File | null;
    resumeText: string;
    template: string;
    personalInfo: any;
  };
  onUpdate: (profile: any) => void;
  onNext: () => void;
}

const BuildProfileStep: React.FC<BuildProfileStepProps> = ({ state, onUpdate, onNext }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const documentProcessor = new DocumentProcessor();

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean, contemporary design' },
    { id: 'classic', name: 'Classic', description: 'Traditional, professional layout' },
    { id: 'creative', name: 'Creative', description: 'Bold, innovative styling' },
    { id: 'minimal', name: 'Minimal', description: 'Simple, elegant approach' }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadProgress(0);
    setUploadStage('Validating file...');

    // Validate file using DocumentProcessor
    const validation = documentProcessor.validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadStage('Reading file...');
    
    try {
      // Use the document processor with progress callback
      setUploadProgress(30);
      setUploadStage('Extracting text...');
      
      const extractedText = await documentProcessor.extractText(file, {
        enableOCR: true,
        onProgress: (progress, stage) => {
          setUploadProgress(30 + (progress * 0.6)); // 30-90%
          setUploadStage(stage);
        }
      });
      
      setUploadProgress(95);
      setUploadStage('Finalizing...');

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the file. Please try pasting your resume text manually.');
      }
      
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
      
      onUpdate({
        ...state,
        resume: file,
        resumeText: extractedText,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          wordCount,
          processingTime: Date.now()
        }
      });

      setUploadProgress(100);
      setUploadStage('Complete!');

      toast({
        title: "✅ Resume Uploaded Successfully",
        description: `Extracted ${wordCount} words from ${file.name}`,
      });

      // Auto-try to extract personal info from the text
      tryExtractPersonalInfo(extractedText);

    } catch (error) {
      console.error('Document processing error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process your resume.";
      setUploadError(errorMessage);
      toast({
        title: "Processing Failed",
        description: errorMessage + " Try pasting your resume text manually.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const tryExtractPersonalInfo = (text: string) => {
    // Simple regex patterns to extract common info
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    if (emailMatch || phoneMatch) {
      onUpdate({
        ...state,
        personalInfo: {
          ...state.personalInfo,
          email: emailMatch ? emailMatch[0] : state.personalInfo?.email,
          phone: phoneMatch ? phoneMatch[0] : state.personalInfo?.phone,
        }
      });
    }
  };

  const handleManualTextSubmit = () => {
    if (!manualText.trim() || manualText.trim().length < 50) {
      toast({
        title: "Text too short",
        description: "Please paste at least 50 characters of your resume.",
        variant: "destructive",
      });
      return;
    }

    const wordCount = manualText.split(/\s+/).filter(word => word.length > 0).length;

    onUpdate({
      ...state,
      resume: new File([manualText], 'manual-resume.txt', { type: 'text/plain' }),
      resumeText: manualText,
      metadata: {
        name: 'Manual Input',
        wordCount,
        processingTime: Date.now()
      }
    });

    toast({
      title: "✅ Resume Text Saved",
      description: `Saved ${wordCount} words from manual input.`,
    });

    setShowManualInput(false);
    tryExtractPersonalInfo(manualText);
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    onUpdate({
      ...state,
      personalInfo: {
        ...state.personalInfo,
        [field]: value
      }
    });
  };

  const clearResume = () => {
    onUpdate({
      ...state,
      resume: null,
      resumeText: '',
      metadata: null
    });
    setUploadError(null);
    setUploadProgress(0);
    setUploadStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canProceed = state.resumeText && state.resumeText.length > 50 && state.template;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
          <Sparkles className="h-8 w-8 mr-3 text-green-600" />
          Step 1: Build Your Profile
        </h2>
        <p className="text-gray-600">Upload your resume and set up your professional profile to get started.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resume Upload */}
        <Card className="p-6 border-green-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-green-600" />
            Upload Resume
          </h3>
          
          <div className="space-y-4">
            {!state.resume ? (
              <>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    uploading 
                      ? 'border-green-400 bg-green-50' 
                      : uploadError 
                      ? 'border-red-300 bg-red-50 hover:border-red-400'
                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <RefreshCw className="h-12 w-12 text-green-500 mx-auto animate-spin" />
                      <div>
                        <p className="text-lg font-medium text-green-700">{uploadStage}</p>
                        <Progress value={uploadProgress} className="w-full mt-3" />
                        <p className="text-sm text-green-600 mt-2">{Math.round(uploadProgress)}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FileText className={`h-12 w-12 mx-auto ${uploadError ? 'text-red-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your resume here
                        </p>
                        <p className="text-sm text-gray-500">
                          or click to browse files
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supports PDF, DOCX, TXT (max 15MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={documentProcessor.getAcceptString()}
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />

                {uploadError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manual Input Option */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Having trouble uploading?</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowManualInput(true)}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Paste resume text manually
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{state.resume.name}</p>
                      <p className="text-sm text-green-600">
                        {state.resumeText.split(/\s+/).filter(w => w).length} words extracted
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearResume}
                      className="text-green-700 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Preview (first 500 chars):</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {state.resumeText.substring(0, 500)}...
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Template Selection */}
        <Card className="p-6 border-green-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2 text-purple-600" />
            Choose Template
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    state.template === template.id
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                  onClick={() => onUpdate({ ...state, template: template.id })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{template.name}</span>
                    {state.template === template.id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Information */}
      <Card className="p-6 border-green-100">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Personal Information
          <span className="text-sm font-normal text-gray-500 ml-2">(Optional - auto-detected if available)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                className="pl-10"
                placeholder="John Doe"
                value={state.personalInfo?.fullName || ''}
                onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="john@example.com"
                value={state.personalInfo?.email || ''}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                className="pl-10"
                placeholder="(555) 123-4567"
                value={state.personalInfo?.phone || ''}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                className="pl-10"
                placeholder="New York, NY"
                value={state.personalInfo?.location || ''}
                onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div />
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8"
          size="lg"
        >
          Next: Target Job
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {!canProceed && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {!state.resumeText 
              ? "Please upload your resume or paste the text to continue."
              : "Please select a template to continue."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Paste Your Resume</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowManualInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Copy and paste your resume text below. Include all sections: Summary, Experience, Education, Skills, etc.
            </p>
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {manualText.split(/\s+/).filter(w => w).length} words
              </span>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowManualInput(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualTextSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={manualText.trim().length < 50}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Resume Text
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BuildProfileStep;
