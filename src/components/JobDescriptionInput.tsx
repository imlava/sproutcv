
import React, { useState } from 'react';
import { Briefcase, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JobDescriptionInputProps {
  onJobDescriptionSubmit: (jobDescription: string) => void;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onJobDescriptionSubmit }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async () => {
    if (jobDescription.trim()) {
      setIsAnalyzing(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      onJobDescriptionSubmit(jobDescription);
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Briefcase className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Step 2: Paste Job Description</h2>
      </div>
      
      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the job description here. Include requirements, qualifications, and key responsibilities for the best analysis..."
        className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        disabled={isAnalyzing}
      />
      
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          {jobDescription.length} characters • Minimum 100 characters recommended
        </p>
        <Button
          onClick={handleSubmit}
          disabled={jobDescription.length < 50 || isAnalyzing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Analyze Match</span>
            </div>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default JobDescriptionInput;
