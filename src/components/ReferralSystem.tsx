import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Gift, Users, Award, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referral_code: string;
  email_referred: string;
  is_signup_completed: boolean;
  is_payment_completed: boolean;
  credits_awarded: boolean;
  created_at: string;
}

const ReferralSystem = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [emailToRefer, setEmailToRefer] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [referralCode, setReferralCode] = useState(userProfile?.referral_code || '');

useEffect(() => {
  if (user) {
    fetchReferrals();
  }
}, [user]);

useEffect(() => {
  if (!user) return;
  const ensureCode = async () => {
    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      if (profErr) {
        console.warn('Profile fetch for referral code failed:', profErr);
      }
      let code = (prof as any)?.referral_code as string | null;
      if (!code) {
        const { data: gen, error: genErr } = await supabase.rpc('generate_referral_code');
        if (genErr) {
          console.error('Failed to generate referral code:', genErr);
          return;
        }
        if (gen) {
          const { error: updErr } = await supabase
            .from('profiles')
            .update({ referral_code: gen })
            .eq('id', user.id);
          if (updErr) {
            console.error('Failed to save referral code:', updErr);
            return;
          }
          setReferralCode(gen as string);
          toast({
            title: 'Referral code created',
            description: 'Share your link to earn credits.',
          });
        }
      } else {
        setReferralCode(code);
      }
    } catch (e) {
      console.error('Error ensuring referral code:', e);
    }
  };
  ensureCode();
}, [user]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
      
      // Calculate total credits earned
      const earned = (data || []).filter(r => r.credits_awarded).length * 3;
      setTotalEarned(earned);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

const copyReferralLink = () => {
  if (!referralCode) return;
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://sproutcv.app' 
    : window.location.origin;
  const referralLink = `${baseUrl}?ref=${referralCode}`;
  navigator.clipboard.writeText(referralLink);
  toast({
    title: "Link copied!",
    description: "Your referral link has been copied to clipboard",
  });
};

const copyReferralCode = () => {
  if (!referralCode) return;
  navigator.clipboard.writeText(referralCode);
  toast({
    title: "Code copied!",
    description: "Your referral code has been copied to clipboard",
  });
};

const sendReferralInvite = async () => {
  if (!emailToRefer.trim() || !referralCode) return;

  setLoading(true);
  
  try {
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user?.id,
        referral_code: referralCode,
        email_referred: emailToRefer.trim()
      });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Referral invitation sent to ${emailToRefer}`,
      });

      setEmailToRefer('');
      fetchReferrals();
    } catch (error) {
      console.error('Error sending referral:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send referral invitation",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (referral: Referral) => {
    if (referral.credits_awarded) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (referral.is_payment_completed) {
      return <Badge className="bg-blue-100 text-blue-800">Payment Made</Badge>;
    } else if (referral.is_signup_completed) {
      return <Badge className="bg-yellow-100 text-yellow-800">Signed Up</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{referrals.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Successful Referrals</p>
              <p className="text-2xl font-bold">{referrals.filter(r => r.credits_awarded).length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Credits Earned</p>
              <p className="text-2xl font-bold">{totalEarned}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Referral Tools */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Share Your Referral</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Your Referral Code</Label>
            <div className="flex mt-2">
  <Input 
    value={referralCode} 
    readOnly 
    className="font-mono"
  />
<Button 
  variant="outline" 
  onClick={copyReferralCode}
  className="ml-2"
  disabled={!referralCode}
>
  <Copy className="h-4 w-4" />
</Button>
            </div>
          </div>

          <div>
            <Label>Your Referral Link</Label>
            <div className="flex items-center space-x-2">
  <Input
    readOnly
    value={`${process.env.NODE_ENV === 'production' ? 'https://sproutcv.app' : window.location.origin}?ref=${referralCode}`}
    className="flex-1"
  />
              <Button onClick={copyReferralLink} variant="outline" disabled={!referralCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="email-invite">Send Direct Invitation</Label>
            <div className="flex mt-2">
              <Input
                id="email-invite"
                type="email"
                value={emailToRefer}
                onChange={(e) => setEmailToRefer(e.target.value)}
                placeholder="friend@example.com"
              />
<Button 
  onClick={sendReferralInvite}
  disabled={!emailToRefer.trim() || loading || !referralCode}
  className="ml-2"
>
  <Gift className="h-4 w-4 mr-2" />
  Send
</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg">
          <h4 className="font-medium text-primary mb-2">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share your referral code or link with friends</li>
            <li>• When they sign up and make their first purchase, you both get 3 credits</li>
            <li>• Track your referrals and earnings in the table below</li>
          </ul>
        </div>
      </Card>

      {/* Referral History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Referral History</h3>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No referrals yet</p>
            <p className="text-sm text-muted-foreground">Start sharing your referral code to earn rewards!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{referral.email_referred}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited on {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(referral)}
                  {referral.credits_awarded && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">+3 Credits</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReferralSystem;