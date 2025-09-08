import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  RefreshCw
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
  const [extractedText, setExtractedText] = useState('');
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

    // Validate file using DocumentProcessor
    if (!documentProcessor.isFileSupported(file)) {
      toast({
        title: "Invalid File",
        description: `Please upload a PDF, DOCX, or TXT file under ${documentProcessor.getMaxFileSize() / (1024 * 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Extract text using DocumentProcessor
      const extractedText = await documentProcessor.extractText(file);
      const metadata = documentProcessor.getFileMetadata(file);
      
      setExtractedText(extractedText.substring(0, 500) + '...');
      
      onUpdate({
        ...state,
        resume: file,
        resumeText: extractedText,
        metadata: {
          ...metadata,
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          processingTime: Date.now()
        }
      });

      toast({
        title: "Resume Uploaded Successfully",
        description: `Processed ${extractedText.split(/\s+/).length} words from ${file.name}`,
      });
    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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

  const canProceed = state.resume && state.template;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 1: Build Your Profile</h2>
        <p className="text-gray-600">Upload your resume and set up your professional profile to get started.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resume Upload */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-green-600" />
            Upload Resume
          </h3>
          
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {state.resume ? state.resume.name : 'Drop your resume here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files (PDF, DOCX, TXT)
                  </p>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {uploading && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Processing your resume...
                </AlertDescription>
              </Alert>
            )}
            
            {state.resume && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Resume uploaded: {state.resume.name}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Template Selection */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2 text-purple-600" />
            Choose Template
          </h3>
          
          <div className="space-y-4">
            <Select value={state.template} onValueChange={(value) => onUpdate({ ...state, template: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {state.template && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Template selected: {templates.find(t => t.id === state.template)?.name}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      </div>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Personal Information
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
          className="bg-green-600 hover:bg-green-700"
        >
          Next: Target Job
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {!canProceed && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please upload your resume and select a template to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BuildProfileStep;
