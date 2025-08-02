
import React, { useState } from 'react';
import { FileDown, FileText, Mail, Share2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ResumeExportOptionsProps {
  analysisId: string;
  jobTitle: string;
  companyName: string;
}

const ResumeExportOptions: React.FC<ResumeExportOptionsProps> = ({
  analysisId,
  jobTitle,
  companyName
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportCompleted, setExportCompleted] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Simulate PDF generation process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setExportCompleted(true);
      toast({
        title: "Resume exported successfully!",
        description: "Your tailored resume has been generated and is ready for download.",
      });
      
      // In real implementation, this would trigger actual PDF download
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,Your tailored resume content here...';
      link.download = `${jobTitle}_${companyName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Unable to generate PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailResume = () => {
    const subject = encodeURIComponent(`Resume for ${jobTitle} at ${companyName}`);
    const body = encodeURIComponent(`Please find my tailored resume attached for the ${jobTitle} position at ${companyName}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareResume = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resume for ${jobTitle}`,
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
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <FileDown className="h-6 w-6 mr-3 text-blue-600" />
        Export Your Tailored Resume
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* PDF Export */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-900">PDF Download</h4>
              <p className="text-sm text-red-700">Professional format</p>
            </div>
          </div>
          
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating PDF...</span>
              </div>
            ) : exportCompleted ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Download PDF</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FileDown className="h-4 w-4" />
                <span>Export as PDF</span>
              </div>
            )}
          </Button>
        </div>

        {/* Email Resume */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Email Resume</h4>
              <p className="text-sm text-blue-700">Send directly</p>
            </div>
          </div>
          
          <Button 
            onClick={handleEmailResume}
            variant="outline"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Mail className="h-4 w-4 mr-2" />
            Open Email Client
          </Button>
        </div>

        {/* Share Resume */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Share Analysis</h4>
              <p className="text-sm text-green-700">Copy link</p>
            </div>
          </div>
          
          <Button 
            onClick={handleShareResume}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">📋 Application Checklist</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Resume analyzed and optimized</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Keywords strategically placed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 rounded" />
            <span>Export resume as PDF</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 rounded" />
            <span>Submit application</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResumeExportOptions;
