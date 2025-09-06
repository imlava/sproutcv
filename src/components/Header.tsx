
import React, { useState } from 'react';
import { Sprout, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const navigationItems = [
    { label: 'Features', action: () => scrollToSection('features') },
    { label: 'How It Works', action: () => handleNavigation('/how-it-works') },
    { label: 'Pricing', action: () => scrollToSection('pricing') },
    { label: 'About', action: () => scrollToSection('about') }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-2 cursor-pointer transition-transform hover:scale-105" onClick={() => handleNavigation('/')}>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">SproutCV</span>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            {navigationItems.map((item, index) => (
              <button 
                key={index}
                onClick={item.action}
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Sign In button clicked');
                handleNavigation('/auth');
              }}
              className="text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started Free
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 bg-white">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-center pb-6 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xl font-bold text-gray-900">SproutCV</span>
                    </div>
                  </div>

                  <nav className="flex-1 py-6">
                    <div className="space-y-2">
                      {navigationItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={item.action}
                          className="w-full text-left px-4 py-3 text-lg font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </nav>

                  <div className="pt-6 border-t space-y-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleNavigation('/auth')}
                      className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => handleNavigation('/auth')}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg"
                    >
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
