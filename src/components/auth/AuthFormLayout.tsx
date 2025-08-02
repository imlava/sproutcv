
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout } from 'lucide-react';

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthFormLayout: React.FC<AuthFormLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                SproutCV
              </h1>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
            <CardDescription className="text-gray-600 text-base">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
