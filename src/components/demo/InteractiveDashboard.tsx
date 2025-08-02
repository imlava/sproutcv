
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sprout,
  User,
  Bell,
  Settings,
  CreditCard,
  Target,
  TrendingUp,
  FileText,
  Star,
  Briefcase,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react';

const InteractiveDashboard = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);

  const metrics = [
    { name: 'Interview Rate', value: 340, suffix: '%', icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
    { name: 'ATS Score', value: 97, suffix: '/100', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { name: 'Response Rate', value: 87, suffix: '%', icon: Star, color: 'from-purple-500 to-pink-500' },
    { name: 'Success Rate', value: 94, suffix: '%', icon: CheckCircle, color: 'from-orange-500 to-red-500' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % metrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    metrics.forEach((metric, index) => {
      let currentValue = 0;
      const increment = metric.value / 50;
      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= metric.value) {
          currentValue = metric.value;
          clearInterval(timer);
        }
        setAnimatedValues(prev => {
          const newValues = [...prev];
          newValues[index] = Math.round(currentValue);
          return newValues;
        });
      }, 30);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 text-lg font-semibold mb-6 shadow-xl">
            <Sprout className="h-5 w-5 mr-2" />
            Real SproutCV Interface
          </Badge>
          <h2 className="text-6xl font-black text-gray-900 mb-8">
            Your Success
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 block">
              Command Center
            </span>
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Experience the actual dashboard where careers transform
          </p>
        </div>

        {/* Premium Dashboard Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 p-8">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">SproutCV Dashboard</h1>
                  <p className="text-gray-300 text-lg">Welcome back, Sarah Chen</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  <span className="font-semibold text-lg">25 Credits</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Bell className="h-6 w-6 cursor-pointer hover:scale-110 transition-transform" />
                  <Settings className="h-6 w-6 cursor-pointer hover:scale-110 transition-transform" />
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Metrics Grid */}
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <Card 
                  key={index} 
                  className={`p-8 transition-all duration-500 cursor-pointer transform hover:scale-105 ${
                    activeMetric === index 
                      ? 'shadow-2xl border-2 border-purple-200 bg-white' 
                      : 'shadow-lg hover:shadow-xl bg-white/80'
                  }`}
                  onClick={() => setActiveMetric(index)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                      <metric.icon className="h-8 w-8 text-white" />
                    </div>
                    {activeMetric === index && (
                      <div className="animate-pulse">
                        <Zap className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">
                    {animatedValues[index]}{metric.suffix}
                  </div>
                  <div className="text-lg font-semibold text-gray-700 mb-4">{metric.name}</div>
                  <Progress value={(animatedValues[index] / metric.value) * 100} className="h-2" />
                </Card>
              ))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-white to-gray-50 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                Recent Transformations
              </h3>
              <div className="space-y-4">
                {[
                  { role: 'Senior Software Engineer', company: 'Google', score: 98, status: 'success', time: '2 min ago' },
                  { role: 'Product Manager', company: 'Microsoft', score: 94, status: 'excellent', time: '5 min ago' },
                  { role: 'Data Scientist', company: 'Meta', score: 96, status: 'outstanding', time: '8 min ago' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.role}</h4>
                        <p className="text-gray-600">{item.company} • {item.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-emerald-600 mb-1">{item.score}%</div>
                      <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="h-6 w-6 mr-3 text-yellow-500" />
                Success Metrics
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Interview Conversion', value: 87, color: 'emerald' },
                  { label: 'ATS Compatibility', value: 96, color: 'blue' },
                  { label: 'Keyword Optimization', value: 94, color: 'purple' },
                  { label: 'Impact Score', value: 98, color: 'orange' }
                ].map((metric, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-700 text-lg">{metric.label}</span>
                      <span className={`text-2xl font-bold text-${metric.color}-600`}>{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;
