
import React, { useState } from 'react';
import { FileDown, FileText, Mail, Share2, CheckCircle, Eye, Download, Printer, Copy, ExternalLink, Star, Target, Zap, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ResumeExportOptionsProps {
  analysisId: string;
  jobTitle: string;
  companyName: string;
  onPreview?: () => void;
  onExport?: () => void;
  onEmail?: () => void;
  onShare?: () => void;
}

const ResumeExportOptions: React.FC<ResumeExportOptionsProps> = ({
  analysisId,
  jobTitle,
  companyName,
  onPreview,
  onExport,
  onEmail,
  onShare
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportCompleted, setExportCompleted] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setActiveExport('pdf');
    setExportProgress(0);
    
    try {
      // Enhanced progressive PDF generation with better feedback
      const progressSteps = [
        { step: 'Preparing resume content...', progress: 20 },
        { step: 'Applying optimizations...', progress: 40 },
        { step: 'Formatting for ATS...', progress: 60 },
        { step: 'Generating PDF...', progress: 80 },
        { step: 'Finalizing document...', progress: 100 }
      ];
      
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress(step.progress);
        // In real implementation, update step message here
      }
      
      setExportCompleted(true);
      toast({
        title: "Resume exported successfully!",
        description: "Your tailored resume has been generated and is ready for download. You can access this file for 30 days.",
      });
      
      // In real implementation, this would trigger actual PDF download
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,Tailored Resume Content...';
      link.download = `${jobTitle}_${companyName}_Tailored_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExport) onExport();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Unable to generate PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
      setActiveExport(null);
    }
  };

  const handleEmailResume = () => {
    const subject = encodeURIComponent(`Tailored Resume for ${jobTitle} at ${companyName}`);
    const body = encodeURIComponent(`Please find my tailored resume attached for the ${jobTitle} position at ${companyName}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
    if (onEmail) onEmail();
    
    toast({
      title: "Email client opened",
      description: "Your email client should open with the resume details pre-filled.",
    });
  };

  const handleShareResume = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tailored Resume for ${jobTitle}`,
          text: `My tailored resume for ${jobTitle} at ${companyName}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Analysis link copied to clipboard",
      });
    }
    
    if (onShare) onShare();
  };

  const handlePrintResume = () => {
    toast({
      title: "Printing resume...",
      description: "Opening print dialog for your tailored resume",
    });
    
    // In real implementation, this would open a print-friendly version
    window.print();
  };

  const handleCopyResumeText = async () => {
    try {
      await navigator.clipboard.writeText(`Tailored Resume for ${jobTitle} at ${companyName}\n\n[Resume content would be here]`);
      toast({
        title: "Resume text copied!",
        description: "Resume content copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy resume text. Please try again.",
      });
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      title: 'PDF Download',
      description: 'Professional format',
      icon: FileText,
      color: 'red',
      action: handleExportPDF,
      loading: isExporting && activeExport === 'pdf',
      completed: exportCompleted && activeExport === 'pdf',
      progress: exportProgress
    },
    {
      id: 'email',
      title: 'Email Resume',
      description: 'Send directly',
      icon: Mail,
      color: 'blue',
      action: handleEmailResume,
      loading: false,
      completed: false,
      progress: 0
    },
    {
      id: 'share',
      title: 'Share Analysis',
      description: 'Copy link',
      icon: Share2,
      color: 'green',
      action: handleShareResume,
      loading: false,
      completed: false,
      progress: 0
    },
    {
      id: 'print',
      title: 'Print Resume',
      description: 'Print-friendly',
      icon: Printer,
      color: 'purple',
      action: handlePrintResume,
      loading: false,
      completed: false,
      progress: 0
    },
    {
      id: 'copy',
      title: 'Copy Text',
      description: 'Plain text',
      icon: Copy,
      color: 'orange',
      action: handleCopyResumeText,
      loading: false,
      completed: false,
      progress: 0
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-50 border-red-200 text-red-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-900';
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileDown className="h-6 w-6 mr-3 text-blue-600" />
            Export Your Tailored Resume
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Multiple formats available for your optimized resume
          </p>
        </div>
        
        {onPreview && (
          <Button 
            onClick={onPreview}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {exportOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <div key={option.id} className={`rounded-lg p-4 border ${getColorClasses(option.color)}`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 ${getIconColor(option.color)} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">{option.title}</h4>
                  <p className="text-sm opacity-80">{option.description}</p>
                </div>
              </div>
              
                             {option.loading && (
                 <div className="space-y-2">
                   <Progress value={option.progress} className="h-2" />
                   <p className="text-xs opacity-70">
                     {option.progress < 20 ? 'Preparing resume content...' :
                      option.progress < 40 ? 'Applying optimizations...' :
                      option.progress < 60 ? 'Formatting for ATS...' :
                      option.progress < 80 ? 'Generating PDF...' :
                      'Finalizing document...'} {option.progress}%
                   </p>
                 </div>
               )}
              
              <Button 
                onClick={option.action}
                disabled={option.loading}
                className={`w-full ${
                  option.loading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : option.completed 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : option.color === 'red' ? 'bg-red-600 hover:bg-red-700 text-white'
                    : option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : option.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white'
                    : option.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : option.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {option.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : option.completed ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Downloaded</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{option.title}</span>
                  </div>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Enhanced Application Checklist */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Application Success Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            { text: 'Resume analyzed and optimized', completed: true },
            { text: 'Keywords strategically placed', completed: true },
            { text: 'ATS compatibility verified', completed: true },
            { text: 'Experience mismatch addressed', completed: true },
            { text: 'Export resume as PDF', completed: exportCompleted },
            { text: 'Submit application', completed: false }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              {item.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded" />
              )}
              <span className={`${item.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
        
                 {exportCompleted && (
           <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
             <div className="flex items-start space-x-3">
               <Star className="h-5 w-5 text-green-600 mt-0.5" />
               <div className="flex-1">
                 <p className="text-sm text-green-800 font-medium mb-1">
                   🎉 Your tailored resume is ready!
                 </p>
                 <p className="text-xs text-green-700">
                   Download and submit with confidence. This file will be available for 30 days.
                 </p>
                 <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                   <Clock className="h-3 w-3" />
                   <span>Access until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-600" />
          Pro Tips for Success
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Save your tailored resume with a clear filename like "{jobTitle}_Resume.pdf"</p>
          <p>• Include a personalized cover letter when submitting your application</p>
          <p>• Follow up with the hiring manager within 1-2 weeks</p>
          <p>• Keep track of all applications in a spreadsheet</p>
        </div>
      </div>
    </Card>
  );
};

export default ResumeExportOptions;
