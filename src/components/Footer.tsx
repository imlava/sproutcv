
import React from 'react';
import { Heart, Sprout, Shield, Award, Users, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Trust Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">Trusted by Professionals Worldwide</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Join thousands of job seekers who have successfully landed their dream jobs with SproutCV's AI-powered resume optimization.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-sm text-gray-400">Happy Users</div>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <Award className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-sm text-gray-400">ATS Success Rate</div>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <Shield className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-400">Secure & Private</div>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <Sprout className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">3x</div>
              <div className="text-sm text-gray-400">More Interviews</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <Sprout className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-white">SproutCV</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Grow your career with AI-powered resume analysis and optimization. 
              Get more interviews, land better jobs.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center text-sm text-gray-400">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                Enterprise Security
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">AI Analysis</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">ATS Optimization</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Keyword Matching</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-2 text-green-500" />
                hello@sproutcv.com
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-2 text-green-500" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                San Francisco, CA
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} SproutCV. All rights reserved.
            </div>
            <div className="flex items-center text-sm text-gray-400">
              Built with <Heart className="h-4 w-4 mx-1 text-red-500" /> by{' '}
              <a 
                href="https://imlava.in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-green-400 hover:text-green-300 transition-colors font-medium ml-1"
              >
                Lava
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
