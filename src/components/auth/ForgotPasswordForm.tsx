
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('forgot-password', {
        body: { email }
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      });

      // For development - show the reset link
      if (data?.resetLink) {
        console.log("Reset link:", data.resetLink);
        toast({
          title: "Development Mode",
          description: `Reset link: ${data.resetLink}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <Button 
          onClick={onBack}
          variant="outline" 
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
        disabled={loading}
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>
      
      <Button 
        type="button"
        onClick={onBack}
        variant="outline" 
        className="w-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to sign in
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
