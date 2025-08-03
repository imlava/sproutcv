
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy,
  Star,
  TrendingUp,
  Users,
  Target,
  Rocket,
  ArrowRight,
  Quote,
  LinkedinIcon,
  Mail,
  Building2,
  Award
} from 'lucide-react';

const SuccessShowcase = () => {
  const navigate = useNavigate();

  const achievements = [
    {
      icon: Users,
      value: "50k+",
      label: "Careers Transformed",
      description: "Professionals worldwide trust SproutCV",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: TrendingUp,
      value: "340%",
      label: "Interview Rate Boost",
      description: "Average increase in interview invitations",
      gradient: "from-emerald-600 to-teal-600"
    },
    {
      icon: Target,
      value: "97%",
      label: "ATS Success Rate",
      description: "Pass rate through major ATS systems",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: Award,
      value: "15s",
      label: "Processing Time",
      description: "Lightning-fast AI optimization",
      gradient: "from-orange-600 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Achievement Stats */}
        <div className="text-center mb-20">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 text-lg font-semibold mb-6 shadow-xl">
            <Trophy className="h-5 w-5 mr-2" />
            Proven Excellence
          </Badge>
          <h2 className="text-6xl font-black text-gray-900 mb-8">
            Numbers That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 block">
              Speak Volumes
            </span>
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto mb-16 leading-relaxed">
            Real metrics from real professionals who transformed their careers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {achievements.map((achievement, index) => (
              <Card key={index} className="group relative overflow-hidden p-8 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100">
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${achievement.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative z-10 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-r ${achievement.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <achievement.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-3">{achievement.value}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{achievement.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Card className="inline-block p-16 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-2xl rounded-3xl border-0 transform hover:scale-105 transition-transform duration-300">
            <Rocket className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-black mb-6">
              Ready to Join Them?
            </h2>
            <p className="text-2xl mb-10 text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              Experience the same transformation that launched 50,000+ careers
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-gray-100 text-2xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-bold rounded-2xl"
                onClick={() => navigate('/auth')}
              >
                <Rocket className="mr-4 h-8 w-8" />
                Start My Transformation
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-4 border-white text-white hover:bg-white hover:text-emerald-600 text-2xl px-12 py-6 transition-all duration-300 font-bold rounded-2xl"
                onClick={() => navigate('/analyze')}
              >
                Try Free Analysis
                <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuccessShowcase;
