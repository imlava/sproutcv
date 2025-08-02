
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your password",
  required = false,
  id,
  name
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="pr-12"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};
