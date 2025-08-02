import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HowItWorksHero from '@/components/how-it-works/HowItWorksHero';
import ProcessSteps from '@/components/how-it-works/ProcessSteps';
import TechnologyShowcase from '@/components/how-it-works/TechnologyShowcase';
import TransformationGallery from '@/components/how-it-works/TransformationGallery';
import SuccessMetrics from '@/components/how-it-works/SuccessMetrics';

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <HowItWorksHero />
      
      {/* Process Steps */}
      <ProcessSteps />
      
      {/* Technology Showcase */}
      <TechnologyShowcase />
      
      {/* Transformation Gallery */}
      <TransformationGallery />
      
      {/* Success Metrics */}
      <SuccessMetrics />
      
      <Footer />
    </div>
  );
};

export default HowItWorksPage;