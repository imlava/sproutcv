
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DemoHeroSection from '@/components/demo/DemoHeroSection';
import InteractiveDashboard from '@/components/demo/InteractiveDashboard';
import AIProcessVisualization from '@/components/demo/AIProcessVisualization';
import SuccessShowcase from '@/components/demo/SuccessShowcase';

const DemoPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section with Premium Design */}
      <DemoHeroSection />
      
      {/* Interactive Dashboard Experience */}
      <InteractiveDashboard />
      
      {/* AI Process Visualization */}
      <AIProcessVisualization />
      
      {/* Success Stories & Social Proof */}
      <SuccessShowcase />
      
      <Footer />
    </div>
  );
};

export default DemoPage;
