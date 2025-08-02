import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Eye,
  Download,
  Zap,
  CheckCircle
} from 'lucide-react';

const TransformationGallery = () => {
  const [selectedExample, setSelectedExample] = useState(0);

  const transformations = [
    {
      industry: "Software Engineering",
      role: "Senior Developer",
      beforeScore: 45,
      afterScore: 92,
      improvement: "+104%",
      highlights: [
        "Added technical keywords",
        "Quantified achievements",
        "ATS-optimized formatting",
        "Industry-specific skills"
      ],
      outcome: "3 interviews in first week"
    },
    {
      industry: "Marketing",
      role: "Digital Marketing Manager",
      beforeScore: 38,
      afterScore: 88,
      improvement: "+131%",
      highlights: [
        "ROI-focused metrics",
        "Campaign achievements",
        "Tool proficiencies",
        "Growth percentages"
      ],
      outcome: "Salary increase: 35%"
    },
    {
      industry: "Finance",
      role: "Financial Analyst",
      beforeScore: 52,
      afterScore: 94,
      improvement: "+80%",
      highlights: [
        "Financial modeling skills",
        "Compliance knowledge",
        "Analytical achievements",
        "Certification highlights"
      ],
      outcome: "Hired at Fortune 500"
    },
    {
      industry: "Healthcare",
      role: "Registered Nurse",
      beforeScore: 41,
      afterScore: 89,
      improvement: "+117%",
      highlights: [
        "Patient care metrics",
        "Medical certifications",
        "Technology proficiency",
        "Leadership experience"
      ],
      outcome: "2 job offers received"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Eye className="w-4 h-4 mr-2" />
            Before & After
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Real{' '}
            <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Transformations
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            See how our AI transforms resumes across different industries and experience levels
          </p>
        </div>

        {/* Industry Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {transformations.map((transform, index) => (
            <Button
              key={index}
              variant={selectedExample === index ? "default" : "outline"}
              onClick={() => setSelectedExample(index)}
              className="px-6 py-3"
            >
              {transform.industry}
            </Button>
          ))}
        </div>

        {/* Transformation Showcase */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Before */}
          <Card className="border-2 border-red-200/50 bg-red-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Before Optimization</h3>
                  <p className="text-sm text-red-600">Needs Improvement</p>
                </div>
              </div>

              {/* Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">ATS Score</span>
                  <span className="text-2xl font-bold text-red-600">
                    {transformations[selectedExample].beforeScore}%
                  </span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${transformations[selectedExample].beforeScore}%` }}
                  />
                </div>
              </div>

              {/* Issues */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground mb-3">Common Issues:</h4>
                {[
                  "Generic job descriptions",
                  "Missing keywords",
                  "Poor formatting",
                  "No quantified results"
                ].map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transformation Arrow */}
          <div className="flex items-center justify-center">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">AI Transformation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Processing in under 30 seconds
                </p>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* After */}
          <Card className="border-2 border-green-200/50 bg-green-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">After Optimization</h3>
                  <p className="text-sm text-green-600">ATS Optimized</p>
                </div>
              </div>

              {/* Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">ATS Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {transformations[selectedExample].afterScore}%
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {transformations[selectedExample].improvement}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-green-100 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${transformations[selectedExample].afterScore}%` }}
                  />
                </div>
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground mb-3">Key Improvements:</h4>
                {transformations[selectedExample].highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">
                {transformations[selectedExample].industry} Success Story
              </h3>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6">
              {transformations[selectedExample].role} position
            </p>
            
            <div className="bg-background/50 rounded-lg p-6 border border-border mb-6">
              <p className="text-xl font-semibold text-primary">
                "{transformations[selectedExample].outcome}"
              </p>
            </div>

            <Button size="lg" className="px-8">
              <Download className="w-5 h-5 mr-2" />
              See Full Transformation
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TransformationGallery;