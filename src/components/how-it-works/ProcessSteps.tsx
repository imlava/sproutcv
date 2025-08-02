import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Brain, 
  Target, 
  Download, 
  FileText, 
  Zap, 
  CheckCircle,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

const ProcessSteps = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      icon: Upload,
      title: "Upload Your Resume",
      subtitle: "Instant Document Analysis",
      description: "Simply upload your current resume in PDF, Word, or text format. Our AI instantly parses and analyzes every element.",
      features: ["Supports all formats", "Instant parsing", "Secure processing"],
      color: "from-primary/10 to-primary/20",
      iconColor: "text-primary",
      duration: "< 5 seconds"
    },
    {
      id: 2,
      icon: Target,
      title: "Job Description Matching",
      subtitle: "AI-Powered Job Analysis",
      description: "Paste the job description you're targeting. Our AI analyzes requirements, keywords, and employer preferences.",
      features: ["Keyword extraction", "Requirements mapping", "Industry analysis"],
      color: "from-primary/15 to-primary/25",
      iconColor: "text-primary",
      duration: "10 seconds"
    },
    {
      id: 3,
      icon: Brain,
      title: "AI Transformation",
      subtitle: "Deep Learning Optimization",
      description: "Our advanced AI rewrites your resume, optimizing keywords, formatting, and content structure for maximum ATS compatibility.",
      features: ["ATS optimization", "Keyword density", "Content enhancement"],
      color: "from-primary/20 to-primary/30",
      iconColor: "text-primary",
      duration: "15 seconds"
    },
    {
      id: 4,
      icon: Download,
      title: "Download & Apply",
      subtitle: "Professional Resume Ready",
      description: "Get your optimized resume with a detailed analysis report. Track your improvement score and start applying with confidence.",
      features: ["Multiple formats", "Analysis report", "Improvement tracking"],
      color: "from-primary/25 to-primary/35",
      iconColor: "text-primary",
      duration: "Instant"
    }
  ];

  return (
    <section id="process" className="py-20 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            The Process
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            From Resume to{' '}
            <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Interview Call
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Our AI-powered process transforms your resume in under 30 seconds with enterprise-grade technology
          </p>
        </div>

        {/* Interactive Steps */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps Navigation */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              
              return (
                <Card 
                  key={step.id}
                  className={`cursor-pointer transition-all duration-300 border-2 ${
                    isActive 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${step.iconColor}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            Step {step.id}: {step.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {step.duration}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-primary font-medium mb-2">
                          {step.subtitle}
                        </p>
                        
                        <p className="text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {step.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-primary" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {isActive && (
                        <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Step Visualization */}
          <div className="lg:sticky lg:top-20">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${steps[activeStep].color} flex items-center justify-center mx-auto mb-4`}>
                    {React.createElement(steps[activeStep].icon, {
                      className: `w-10 h-10 ${steps[activeStep].iconColor}`
                    })}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {steps[activeStep].title}
                  </h3>
                  
                  <p className="text-primary font-semibold">
                    {steps[activeStep].subtitle}
                  </p>
                </div>

                {/* Mock Interface Preview */}
                <div className="bg-background/50 rounded-lg p-6 border border-border mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.location.href = '/analyze'}
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  See Step {steps[activeStep].id} in Action
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to see your resume transformed?
          </p>
          <Button 
            size="lg" 
            className="px-8 py-6 text-lg"
            onClick={() => window.location.href = '/analyze'}
          >
            Start Your Free Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;