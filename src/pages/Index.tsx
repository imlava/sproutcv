
import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ResumeUploader from '@/components/ResumeUploader';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import ScoreDashboard from '@/components/ScoreDashboard';

const Index = () => {
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    console.log('Resume uploaded:', file.name);
  };

  const handleJobDescriptionSubmit = (jd: string) => {
    setJobDescription(jd);
    // Simulate AI analysis results
    const mockResults = {
      overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
      keywordMatch: Math.floor(Math.random() * 30) + 65,
      skillsAlignment: Math.floor(Math.random() * 35) + 60,
      atsCompatibility: Math.floor(Math.random() * 20) + 75,
      experienceRelevance: Math.floor(Math.random() * 25) + 70
    };
    setAnalysisResults(mockResults);
    setStep(3);
    console.log('Job description analyzed:', jd.substring(0, 100) + '...');
  };

  const shouldShowAnalysis = uploadedFile && jobDescription && analysisResults;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {!uploadedFile && !jobDescription && <Hero />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {shouldShowAnalysis ? (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete</h2>
              <p className="text-gray-600">
                Here's how well your resume matches the job description for {uploadedFile?.name}
              </p>
            </div>
            <ScoreDashboard
              overallScore={analysisResults.overallScore}
              keywordMatch={analysisResults.keywordMatch}
              skillsAlignment={analysisResults.skillsAlignment}
              atsCompatibility={analysisResults.atsCompatibility}
              experienceRelevance={analysisResults.experienceRelevance}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <ResumeUploader onFileUpload={handleFileUpload} />
            {uploadedFile && (
              <JobDescriptionInput onJobDescriptionSubmit={handleJobDescriptionSubmit} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
