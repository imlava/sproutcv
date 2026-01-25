/**
 * Fast Mode Uploader Component
 * Streamlined drag-drop with instant processing
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import {
  Upload,
  FileText,
  Copy,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Briefcase,
} from 'lucide-react';

// Configure PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface FastModeUploaderProps {
  onSubmit: (resumeText: string, file: File | null, jobDescription: string) => void;
}

const FastModeUploader: React.FC<FastModeUploaderProps> = ({ onSubmit }) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStage, setProcessStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Supported file types
  const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file || file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 15MB.' };
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'Unsupported file type. Please use PDF, DOCX, or TXT files.' };
    }
    return { valid: true };
  };

  // Extract text from PDF
  const extractFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProcessProgress(20 + Math.round((i / pdf.numPages) * 50));
      setProcessStage(`Reading page ${i} of ${pdf.numPages}...`);
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  };

  // Extract text from DOCX
  const extractFromDOCX = async (file: File): Promise<string> => {
    setProcessProgress(40);
    setProcessStage('Parsing Word document...');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    setProcessProgress(70);
    return result.value.trim();
  };

  // Extract text from plain text file
  const extractFromText = async (file: File): Promise<string> => {
    setProcessProgress(50);
    setProcessStage('Reading text file...');
    
    const text = await file.text();
    setProcessProgress(80);
    return text.trim();
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setError(null);
    setProcessProgress(0);
    setProcessStage('Validating file...');

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: validation.error,
      });
      return;
    }

    setIsProcessing(true);
    setProcessProgress(10);
    setProcessStage('Processing file...');

    try {
      let extractedText = '';
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (ext === 'pdf') {
        extractedText = await extractFromPDF(file);
      } else if (ext === 'docx') {
        extractedText = await extractFromDOCX(file);
      } else {
        extractedText = await extractFromText(file);
      }

      // Clean up text
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Could not extract sufficient text from the file.');
      }

      const wordCount = extractedText.split(/\s+/).filter(w => w).length;
      
      setProcessProgress(100);
      setProcessStage('Complete!');
      setResumeText(extractedText);
      setResumeFile(file);

      toast({
        title: "Resume Uploaded",
        description: `Extracted ${wordCount} words from ${file.name}`,
      });

    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Clear resume
  const clearResume = () => {
    setResumeText('');
    setResumeFile(null);
    setError(null);
    setProcessProgress(0);
    setProcessStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (!resumeText.trim()) {
      toast({
        variant: "destructive",
        title: "No Resume",
        description: "Please upload or paste your resume.",
      });
      return;
    }

    onSubmit(resumeText, resumeFile, jobDescription);
  };

  const wordCount = resumeText.split(/\s+/).filter(w => w).length;
  const canSubmit = resumeText.trim().length > 50;

  return (
    <div className="space-y-6">
      {/* Main Upload Card */}
      <Card className="p-6">
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'paste')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Your Resume
            </h2>
            <TabsList>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <Copy className="h-4 w-4" />
                Paste
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            {!resumeFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? 'border-green-500 bg-green-50'
                    : isProcessing
                    ? 'border-green-400 bg-green-50'
                    : error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                {isProcessing ? (
                  <div className="space-y-4">
                    <RefreshCw className="h-12 w-12 text-green-500 mx-auto animate-spin" />
                    <div>
                      <p className="text-lg font-medium text-green-700">{processStage}</p>
                      <Progress value={processProgress} className="w-64 mx-auto mt-3" />
                      <p className="text-sm text-green-600 mt-2">{processProgress}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-green-600" />
                    </div>
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
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">{resumeFile.name}</p>
                      <p className="text-sm text-green-600">{wordCount} words extracted</p>
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
                  <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {resumeText.substring(0, 500)}...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Paste Tab */}
          <TabsContent value="paste" className="mt-0">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{wordCount} words</span>
                {wordCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearResume}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Optional Job Description */}
      <Card className="p-6">
        <button
          onClick={() => setShowJobInput(!showJobInput)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Target Job Description</h3>
              <p className="text-sm text-gray-500">Optional - for better keyword analysis</p>
            </div>
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            {showJobInput ? 'Hide' : 'Add'}
          </Badge>
        </button>

        {showJobInput && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Textarea
              placeholder="Paste the job description you're targeting..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[120px] text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Adding a job description improves keyword matching accuracy by 30%
            </p>
          </div>
        )}
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-6 text-lg"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Analyze My Resume
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {!canSubmit && resumeText.length > 0 && (
        <p className="text-center text-sm text-amber-600">
          Resume text seems too short. Please add more content.
        </p>
      )}
    </div>
  );
};

export default FastModeUploader;
