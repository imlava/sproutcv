/**
 * Multi-Resume Uploader Component
 * Allows users to upload multiple resumes for batch analysis or comparison
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Loader2, 
  Image, 
  File,
  Trash2,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DocumentProcessor, 
  SUPPORTED_EXTENSIONS, 
  MAX_FILE_SIZE 
} from '@/services/document/DocumentProcessor';
import { useToast } from '@/hooks/use-toast';

interface ProcessedFile {
  id: string;
  file: File;
  text?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    wordCount: number;
    characterCount: number;
    processingTime: number;
    method: string;
  };
}

interface MultiResumeUploaderProps {
  maxFiles?: number;
  onFilesProcessed: (files: ProcessedFile[]) => void;
  onCompareResumes?: (files: ProcessedFile[]) => void;
  allowComparison?: boolean;
  className?: string;
}

const documentProcessor = new DocumentProcessor();

const generateId = () => Math.random().toString(36).substring(7);

const getFileIcon = (file: File) => {
  const type = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(ext || '')) {
    return <Image className="h-5 w-5 text-purple-500" />;
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes('wordprocessingml') || ['doc', 'docx'].includes(ext || '')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const MultiResumeUploader: React.FC<MultiResumeUploaderProps> = ({
  maxFiles = 10,
  onFilesProcessed,
  onCompareResumes,
  allowComparison = true,
  className = '',
}) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed. You can add ${maxFiles - files.length} more.`,
        variant: "destructive",
      });
      return;
    }

    // Validate and add files
    const validatedFiles: ProcessedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        errors.push(`${file.name} is already added`);
        continue;
      }

      const validation = documentProcessor.validateFile(file);
      if (validation.valid) {
        validatedFiles.push({
          id: generateId(),
          file,
          status: 'pending',
          progress: 0,
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Some Files Skipped",
        description: errors.slice(0, 3).join('. ') + (errors.length > 3 ? `... and ${errors.length - 3} more` : ''),
        variant: "destructive",
      });
    }

    if (validatedFiles.length > 0) {
      setFiles(prev => [...prev, ...validatedFiles]);
      toast({
        title: "Files Added",
        description: `Added ${validatedFiles.length} file${validatedFiles.length > 1 ? 's' : ''} for processing`,
      });
    }
  }, [files, maxFiles, toast]);

  const processFile = useCallback(async (fileId: string): Promise<void> => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const processedFile = files[fileIndex];
    
    // Update status to processing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
    ));

    try {
      const result = await documentProcessor.extractTextWithMetadata(processedFile.file, {
        enableOCR: true,
        onProgress: (progress, _stage) => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: Math.min(10 + progress * 0.8, 90) } : f
          ));
        },
      });

      setFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'success',
          progress: 100,
          text: result.text,
          metadata: {
            wordCount: result.metadata.wordCount,
            characterCount: result.metadata.characterCount,
            processingTime: result.metadata.processingTime,
            method: result.metadata.method,
          },
        } : f
      ));
    } catch (error) {
      console.error('File processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Processing failed',
        } : f
      ));
    }
  }, [files]);

  const processAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsProcessingAll(true);

    for (const file of pendingFiles) {
      await processFile(file.id);
    }

    setIsProcessingAll(false);

    // Notify parent of processed files
    setFiles(currentFiles => {
      const successfulFiles = currentFiles.filter(f => f.status === 'success');
      onFilesProcessed(successfulFiles);
      return currentFiles;
    });
  }, [files, processFile, onFilesProcessed]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const retryFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
  }, []);

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
    
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const successfulFiles = files.filter(f => f.status === 'success');
  const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
  const processingFiles = files.filter(f => f.status === 'processing');

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Batch Resume Upload
        </h2>
        {files.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-gray-500">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer mb-4
          ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
          ${isProcessingAll ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessingAll && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
        
        <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
        <p className="text-gray-600 mb-2">
          Drop multiple resumes here or click to browse
        </p>
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          <Badge variant="outline" className="text-xs">PDF</Badge>
          <Badge variant="outline" className="text-xs">DOCX</Badge>
          <Badge variant="outline" className="text-xs">TXT</Badge>
          <Badge variant="outline" className="text-xs">Images</Badge>
        </div>
        <p className="text-xs text-gray-400">
          Up to {maxFiles} files • Max {formatFileSize(MAX_FILE_SIZE)} each
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{files.length} file{files.length > 1 ? 's' : ''} added</span>
            <span>
              {successfulFiles.length} processed • {pendingFiles.length} pending
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {files.map((processedFile) => (
              <div
                key={processedFile.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${processedFile.status === 'success' ? 'bg-green-50 border-green-200' : ''}
                  ${processedFile.status === 'error' ? 'bg-red-50 border-red-200' : ''}
                  ${processedFile.status === 'processing' ? 'bg-blue-50 border-blue-200' : ''}
                  ${processedFile.status === 'pending' ? 'bg-gray-50 border-gray-200' : ''}
                `}
              >
                {getFileIcon(processedFile.file)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 truncate text-sm">
                      {processedFile.file.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(processedFile.file.size)})
                    </span>
                  </div>
                  
                  {processedFile.status === 'processing' && (
                    <Progress value={processedFile.progress} className="h-1 mt-1" />
                  )}
                  
                  {processedFile.status === 'success' && processedFile.metadata && (
                    <p className="text-xs text-green-600 mt-0.5">
                      {processedFile.metadata.wordCount} words
                      {processedFile.metadata.method === 'ocr' && ' (OCR)'}
                    </p>
                  )}
                  
                  {processedFile.status === 'error' && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">
                      {processedFile.error}
                    </p>
                  )}
                </div>
                
                {/* Status Icon */}
                {processedFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                {processedFile.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryFile(processedFile.id);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {processedFile.status === 'processing' && (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {processedFile.status === 'pending' && (
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                )}
                
                {/* Remove Button */}
                {processedFile.status !== 'processing' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(processedFile.id);
                    }}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {pendingFiles.length > 0 && (
            <Button 
              onClick={processAllFiles} 
              disabled={isProcessingAll || processingFiles.length > 0}
              className="flex-1"
            >
              {isProcessingAll || processingFiles.length > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing {processingFiles.length > 0 ? `(${processingFiles.length})` : '...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
          
          {allowComparison && successfulFiles.length >= 2 && onCompareResumes && (
            <Button 
              variant="outline" 
              onClick={() => onCompareResumes(successfulFiles)}
              disabled={isProcessingAll}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Compare ({successfulFiles.length})
            </Button>
          )}
        </div>
      )}

      {/* Success Summary */}
      {successfulFiles.length > 0 && pendingFiles.length === 0 && processingFiles.length === 0 && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All {successfulFiles.length} resume{successfulFiles.length > 1 ? 's have' : ' has'} been processed successfully!
            Total: {successfulFiles.reduce((acc, f) => acc + (f.metadata?.wordCount || 0), 0)} words extracted.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};

export default MultiResumeUploader;
