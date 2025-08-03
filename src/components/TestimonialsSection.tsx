import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      text: "SproutCV transformed my resume and landed me my dream job at Google! The AI insights were incredibly detailed and helped me optimize for ATS systems perfectly."
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager",
      company: "Meta",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      text: "The detailed feedback and suggestions were spot-on. Within 2 weeks of using SproutCV, I got interviews from 5 top tech companies. Absolutely worth it!"
    },
    {
      name: "Emily Rodriguez",
      role: "Data Scientist",
      company: "Microsoft",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      text: "As someone changing careers into tech, SproutCV helped me highlight transferable skills I didn't even know I had. Got my first data science role within a month!"
    }
  ];

  const companyLogos = [
    { name: "Google", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" },
    { name: "Microsoft", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg" },
    { name: "Amazon", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" },
    { name: "Meta", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" },
    { name: "Apple", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" },
    { name: "Netflix", logo: "https://images.ctfassets.net/y2ske730sjqp/1aONibCke6niZhgPxuiilC/2c401b05a07288746ddf3bd3943fbc76/BrandAssets_Logos_01-Wordmark.jpg" }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Professionals at Top Companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful professionals who've transformed their careers with SproutCV
          </p>
        </div>

        {/* Company Logos */}
        <div className="mb-16">
          <p className="text-center text-sm text-gray-500 mb-8">Our users work at these amazing companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companyLogos.map((company) => (
              <div key={company.name} className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300">
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/120x40/f0f0f0/666666?text=${company.name}`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Quote className="h-8 w-8 text-primary opacity-50" />
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-primary font-medium">{testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="inline-flex items-center gap-8 bg-white rounded-lg px-8 py-4 shadow-sm border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">25,000+ Resumes Optimized</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">98% Success Rate</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">4.9/5 User Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;