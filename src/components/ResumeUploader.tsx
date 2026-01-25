import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, Image, File } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DocumentProcessor, 
  SUPPORTED_EXTENSIONS, 
  MAX_FILE_SIZE 
} from '@/services/document/DocumentProcessor';
import { useToast } from '@/hooks/use-toast';

interface ResumeUploaderProps {
  onFileUpload: (file: File, text?: string) => void;
  onTextExtracted?: (text: string, metadata?: any) => void;
  extractText?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

interface UploadedFile {
  file: File;
  text?: string;
  status: 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    wordCount: number;
    characterCount: number;
    processingTime: number;
    method: string;
  };
}

const documentProcessor = new DocumentProcessor();

// File type icons
const getFileIcon = (file: File) => {
  const type = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(ext || '')) {
    return <Image className="h-6 w-6 text-purple-500" />;
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  if (type.includes('wordprocessingml') || ['doc', 'docx'].includes(ext || '')) {
    return <FileText className="h-6 w-6 text-blue-500" />;
  }
  return <File className="h-6 w-6 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ 
  onFileUpload,
  onTextExtracted,
  extractText = true,
  multiple = false,
  maxFiles = 5,
  showPreview = true,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const uploadedFile: UploadedFile = {
      file,
      status: 'uploading',
      progress: 0,
    };

    // Validate file
    const validation = documentProcessor.validateFile(file);
    if (!validation.valid) {
      return {
        ...uploadedFile,
        status: 'error',
        error: validation.error,
        progress: 0,
      };
    }

    // Update to processing status
    uploadedFile.status = 'processing';
    uploadedFile.progress = 20;

    if (!extractText) {
      // Just return the file without text extraction
      onFileUpload(file);
      return {
        ...uploadedFile,
        status: 'success',
        progress: 100,
      };
    }

    try {
      // Extract text with progress tracking
      const result = await documentProcessor.extractTextWithMetadata(file, {
        enableOCR: true, // Enable OCR for scanned documents
        onProgress: (progress, stage) => {
          uploadedFile.progress = Math.min(20 + progress * 0.7, 90);
        },
      });

      uploadedFile.text = result.text;
      uploadedFile.metadata = {
        wordCount: result.metadata.wordCount,
        characterCount: result.metadata.characterCount,
        processingTime: result.metadata.processingTime,
        method: result.metadata.method,
      };
      uploadedFile.status = 'success';
      uploadedFile.progress = 100;

      // Call callbacks
      onFileUpload(file, result.text);
      if (onTextExtracted) {
        onTextExtracted(result.text, result.metadata);
      }

      // Show success toast
      toast({
        title: "Resume Processed",
        description: `Successfully extracted ${result.metadata.wordCount} words from ${file.name}`,
      });

      return uploadedFile;
    } catch (error) {
      console.error('File processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        ...uploadedFile,
        status: 'error',
        error: errorMessage,
        progress: 0,
      };
    }
  }, [extractText, onFileUpload, onTextExtracted, toast]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      toast({
        title: "Multiple Files",
        description: "Only one file can be uploaded at a time",
        variant: "destructive",
      });
      return;
    }

    if (multiple && fileArray.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Process files sequentially to avoid overwhelming the system
    const results: UploadedFile[] = [];
    for (const file of fileArray) {
      const result = await processFile(file);
      results.push(result);
      setUploadedFiles(prev => {
        const existing = prev.filter(f => f.file.name !== file.name);
        return [...existing, result];
      });
    }

    setIsProcessing(false);
  }, [multiple, maxFiles, processFile, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const successfulUploads = uploadedFiles.filter(f => f.status === 'success');
  const hasUploaded = successfulUploads.length > 0;

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary" />
        {multiple ? 'Upload Your Resumes' : 'Upload Your Resume'}
      </h2>
      
      {/* Upload Zone */}
        <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          className="hidden"
          multiple={multiple}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Processing your resume...
            </h3>
            <p className="text-gray-500">This may take a moment for scanned documents</p>
          </div>
        ) : (
          <>
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Drop your resume here or click to browse
          </h3>
            <p className="text-gray-500 mb-4">
              Supports PDF, Word documents, text files, and images (for scanned resumes)
            </p>
            
            {/* Supported formats badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">PDF</Badge>
              <Badge variant="outline" className="text-xs">DOCX</Badge>
              <Badge variant="outline" className="text-xs">TXT</Badge>
              <Badge variant="outline" className="text-xs">PNG/JPG</Badge>
              <Badge variant="outline" className="text-xs">RTF</Badge>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90">
            Choose File
            </Button>
            
            <p className="text-xs text-gray-400 mt-4">
              Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && showPreview && (
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-gray-700">
            {multiple ? 'Uploaded Files' : 'Uploaded File'}
          </h3>
          
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={`${uploadedFile.file.name}-${index}`}
              className={`
                flex items-center gap-3 p-4 rounded-lg border transition-all
                ${uploadedFile.status === 'success' ? 'bg-green-50 border-green-200' : ''}
                ${uploadedFile.status === 'error' ? 'bg-red-50 border-red-200' : ''}
                ${uploadedFile.status === 'processing' ? 'bg-blue-50 border-blue-200' : ''}
                ${uploadedFile.status === 'uploading' ? 'bg-gray-50 border-gray-200' : ''}
              `}
            >
              {/* File Icon */}
              {getFileIcon(uploadedFile.file)}
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(uploadedFile.file.size)})
                  </span>
                </div>
                
                {uploadedFile.status === 'processing' && (
                  <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                )}
                
                {uploadedFile.status === 'success' && uploadedFile.metadata && (
                  <p className="text-sm text-green-600 mt-1">
                    {uploadedFile.metadata.wordCount} words extracted 
                    {uploadedFile.metadata.method === 'ocr' && ' (via OCR)'}
                  </p>
                )}
                
                {uploadedFile.status === 'error' && (
                  <p className="text-sm text-red-600 mt-1">
                    {uploadedFile.error}
                  </p>
                )}
              </div>
              
              {/* Status Icon */}
              {uploadedFile.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {uploadedFile.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              {uploadedFile.status === 'processing' && (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              )}
              
              {/* Remove Button */}
              {uploadedFile.status !== 'processing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadedFile.file.name);
                  }}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary for successful uploads */}
      {hasUploaded && !multiple && successfulUploads[0]?.text && (
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Resume Ready for Analysis
          </h4>
          <p className="text-sm text-gray-600">
            Your resume has been processed and is ready. Click "Start Analysis" to continue.
          </p>
          {successfulUploads[0].metadata && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{successfulUploads[0].metadata.wordCount} words</span>
              <span>{successfulUploads[0].metadata.characterCount} characters</span>
              <span>Processed in {successfulUploads[0].metadata.processingTime.toFixed(0)}ms</span>
          </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ResumeUploader;
