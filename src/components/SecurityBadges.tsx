import React from 'react';
import { Shield, Lock, Award, CheckCircle } from 'lucide-react';

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption",
      badge: "SOC 2 Compliant"
    },
    {
      icon: Lock,
      title: "Data Protection",
      description: "GDPR & CCPA compliant",
      badge: "Privacy First"
    },
    {
      icon: Award,
      title: "Industry Certified",
      description: "ISO 27001 certified",
      badge: "Verified"
    },
    {
      icon: CheckCircle,
      title: "Secure Infrastructure",
      description: "99.9% uptime guarantee",
      badge: "Reliable"
    }
  ];

  return (
    <div className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your Security is Our Priority
          </h3>
          <p className="text-gray-600">
            Trusted by professionals worldwide with enterprise-grade security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {feature.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Security Logos */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-6">Secured by industry leaders</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">SSL</span>
            </div>
            <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">SOC 2</span>
            </div>
            <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">GDPR</span>
            </div>
            <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">ISO 27001</span>
            </div>
          </div>
        </div>

        {/* Privacy Statement */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            We never sell your data. Your resume information is encrypted and stored securely. 
            You maintain full control over your data with the ability to delete it at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityBadges;