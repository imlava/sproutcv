import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Shield, 
  Zap, 
  Target, 
  Database, 
  Cpu, 
  Globe, 
  Lock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const TechnologyShowcase = () => {
  const technologies = [
    {
      icon: Brain,
      title: "Advanced NLP",
      subtitle: "Natural Language Processing",
      description: "Our AI understands context, industry terminology, and recruiter preferences to craft compelling narratives.",
      features: ["GPT-4 Integration", "Industry Knowledge", "Context Awareness"],
      color: "from-blue-500/10 to-blue-600/20",
      iconColor: "text-blue-600"
    },
    {
      icon: Target,
      title: "ATS Optimization",
      subtitle: "Applicant Tracking Systems",
      description: "Specifically designed to pass through ATS filters used by 95% of Fortune 500 companies.",
      features: ["Keyword Optimization", "Format Compatibility", "Parsing Accuracy"],
      color: "from-green-500/10 to-green-600/20",
      iconColor: "text-green-600"
    },
    {
      icon: Database,
      title: "Real-Time Analysis",
      subtitle: "Live Job Market Data",
      description: "Continuously updated with millions of job postings to understand current market demands.",
      features: ["Market Trends", "Salary Insights", "Skills Demand"],
      color: "from-purple-500/10 to-purple-600/20",
      iconColor: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      subtitle: "Bank-Level Protection",
      description: "Your data is encrypted end-to-end and never stored. Complete privacy guaranteed.",
      features: ["256-bit Encryption", "Zero Storage", "GDPR Compliant"],
      color: "from-red-500/10 to-red-600/20",
      iconColor: "text-red-600"
    }
  ];

  const metrics = [
    { value: "99.7%", label: "ATS Pass Rate", icon: CheckCircle },
    { value: "3x", label: "Interview Rate", icon: TrendingUp },
    { value: "< 30s", label: "Processing Time", icon: Zap },
    { value: "15+", label: "Industries Covered", icon: Globe }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/5 to-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Cpu className="w-4 h-4 mr-2" />
            Technology Stack
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Powered by{' '}
            <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Cutting-Edge AI
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Enterprise-grade technology that Fortune 500 companies trust for their hiring processes
          </p>
        </div>

        {/* Technology Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            
            return (
              <Card key={index} className="border-2 border-border hover:border-primary/30 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${tech.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${tech.iconColor}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {tech.title}
                      </h3>
                      <p className="text-sm text-primary font-medium">
                        {tech.subtitle}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4">
                    {tech.description}
                  </p>
                  
                  <div className="space-y-2">
                    {tech.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <Card className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Proven Performance
              </h3>
              <p className="text-muted-foreground">
                Real results from 50,000+ successful transformations
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Security Highlight */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-red-500/5 to-orange-500/5 border-red-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-bold text-foreground">
                  Your Privacy is Our Priority
                </h3>
              </div>
              <p className="text-muted-foreground">
                We never store your resume data. All processing happens in real-time with 
                end-to-end encryption, ensuring your personal information stays completely private.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TechnologyShowcase;