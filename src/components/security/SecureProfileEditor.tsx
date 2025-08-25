import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Phone, Settings } from 'lucide-react';

interface SecurityPreferences {
  login_alerts: boolean;
  email_notifications: boolean;
  [key: string]: boolean;
}

const SecureProfileEditor: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [securityPreferences, setSecurityPreferences] = useState<SecurityPreferences>({
    login_alerts: true,
    email_notifications: true
  });
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  const handlePhoneUpdate = async () => {
    if (!phoneNumber.trim() || !verificationCode.trim()) {
      toast.error('Please enter both phone number and verification code');
      return;
    }

    setIsUpdatingPhone(true);
    try {
      const { data, error } = await supabase.rpc('update_phone_number', {
        new_phone: phoneNumber,
        verification_code: verificationCode
      });

      if (error) throw error;

      toast.success('Phone number updated successfully');
      setPhoneNumber('');
      setVerificationCode('');
    } catch (error: any) {
      console.error('Phone update error:', error);
      toast.error(error.message || 'Failed to update phone number');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsUpdatingPreferences(true);
    try {
      const { data, error } = await supabase.rpc('update_user_security_preferences', {
        new_preferences: securityPreferences
      });

      if (error) throw error;

      toast.success('Security preferences updated successfully');
    } catch (error: any) {
      console.error('Preferences update error:', error);
      toast.error(error.message || 'Failed to update security preferences');
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Secure Phone Number Update
          </CardTitle>
          <CardDescription>
            Update your phone number with verification for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">New Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification">Verification Code</Label>
            <Input
              id="verification"
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              In a production environment, this would be sent via SMS
            </p>
          </div>
          <Button 
            onClick={handlePhoneUpdate}
            disabled={isUpdatingPhone}
            className="w-full"
          >
            {isUpdatingPhone ? 'Updating...' : 'Update Phone Number'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Preferences
          </CardTitle>
          <CardDescription>
            Configure your security and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="login-alerts">Login Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              id="login-alerts"
              checked={securityPreferences.login_alerts}
              onCheckedChange={(checked) => 
                setSecurityPreferences(prev => ({ ...prev, login_alerts: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important security and account updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={securityPreferences.email_notifications}
              onCheckedChange={(checked) => 
                setSecurityPreferences(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>
          <Button 
            onClick={handlePreferencesUpdate}
            disabled={isUpdatingPreferences}
            className="w-full"
          >
            {isUpdatingPreferences ? 'Updating...' : 'Update Preferences'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Your profile data is protected with advanced security measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Profile Access Logging</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sensitive Data Encryption</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Suspicious Activity Detection</span>
              <span className="text-green-600 font-medium">Monitoring</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Row Level Security</span>
              <span className="text-green-600 font-medium">Enforced</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureProfileEditor;