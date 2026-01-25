/**
 * Authenticated Header Component
 * Used on pages where the user is logged in (Dashboard, Analyze, Studio, etc.)
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  CreditCard, 
  LayoutDashboard, 
  Brain, 
  Palette, 
  LogOut,
  ChevronDown,
  Plus,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AuthenticatedHeaderProps {
  onBuyCredits?: () => void;
}

const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({ onBuyCredits }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analyze', label: 'Analyze', icon: Brain },
    { path: '/studio', label: 'Studio', icon: Palette },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hidden sm:block">
              SproutCV
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`${
                    isActive(item.path)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Credits Display */}
            <div 
              className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-1.5 rounded-full cursor-pointer hover:border-green-300 transition-colors"
              onClick={onBuyCredits}
            >
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                {userProfile?.credits ?? 0}
              </span>
              <Plus className="h-3 w-3 text-green-500" />
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/analyze')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Resume
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/studio')}>
                  <Palette className="h-4 w-4 mr-2" />
                  Resume Studio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/referrals')}>
                  <User className="h-4 w-4 mr-2" />
                  Referrals
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 text-xs">
                    +3
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
