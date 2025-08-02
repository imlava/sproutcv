
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const getPasswordStrength = (password: string) => {
    const checks = [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Contains number', valid: /\d/.test(password) },
      { label: 'Contains special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    return checks;
  };

  const passwordChecks = getPasswordStrength(password);
  const validCount = passwordChecks.filter(check => check.valid).length;
  
  const getStrengthColor = () => {
    if (validCount < 2) return 'text-red-500 bg-red-100';
    if (validCount < 4) return 'text-orange-500 bg-orange-100';
    return 'text-green-500 bg-green-100';
  };

  const getStrengthText = () => {
    if (validCount < 2) return 'Weak';
    if (validCount < 4) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStrengthColor()}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="space-y-2">
        {passwordChecks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            {check.valid ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-gray-400" />
            )}
            <span className={check.valid ? 'text-green-700' : 'text-gray-500'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
