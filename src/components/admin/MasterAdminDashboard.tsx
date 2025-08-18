import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedUserManagement from './EnhancedUserManagement';
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  RefreshCw,
  LogOut,
  Send,
  Eye,
  DollarSign,
  UserPlus,
  Gift,
  BarChart3,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  ClipboardCopy,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  credits: number;
  status: string;
  subscription_tier: string;
  is_active: boolean;
  notes?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  failed_login_attempts: number;
  referral_code?: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  credits_purchased: number;
  status: string;
  payment_method: string;
  created_at: string;
  refund_status: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  is_signup_completed: boolean;
  is_payment_completed: boolean;
  credits_awarded: boolean;
  created_at: string;
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_analyses: number;
  total_revenue: number;
  pending_messages: number;
}

const MasterAdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dodoTestMode, setDodoTestMode] = useState(false);
  const [webhookErrors, setWebhookErrors] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentFrom, setPaymentFrom] = useState<string>('');
  const [paymentTo, setPaymentTo] = useState<string>('');
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc('admin_get_user_stats');
      if (statsError) throw statsError;
      setStats(statsData[0]);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch recent webhook/security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .ilike('event_type', '%webhook%')
        .order('created_at', { ascending: false })
        .limit(25);
      if (!eventsError) setWebhookErrors(eventsData || []);

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    try {
      const channel = supabase
        .channel('admin-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
          fetchDashboardData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscriptions established');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Real-time subscription error - continuing without live updates');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.warn('Failed to setup real-time subscriptions:', error);
      return () => {};
    }
  };

  const filteredUsers = users.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()));
  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch = !paymentSearch || (p.payment_provider_id || p.stripe_session_id || p.id).toLowerCase().includes(paymentSearch.toLowerCase()) || (p.profiles?.email || '').toLowerCase().includes(paymentSearch.toLowerCase());
    const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    const created = new Date(p.created_at).getTime();
    const fromOk = !paymentFrom || created >= new Date(paymentFrom).getTime();
    const toOk = !paymentTo || created <= new Date(paymentTo).getTime();
    return matchesSearch && matchesStatus && fromOk && toOk;
  });

  const handleReplyToMessage = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      const { error } = await supabase.functions.invoke('admin-message-reply', {
        body: {
          contactMessageId: selectedMessage.id,
          replyContent: replyContent.trim(),
          sendEmail: true
        }
      });

      if (error) throw error;

      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully"
      });

      setSelectedMessage(null);
      setReplyContent('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reply"
      });
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    try {
      const { error } = await supabase.rpc('admin_add_credits', {
        target_user_id: selectedUser.id,
        credits_to_add: parseInt(creditAmount),
        admin_note: adminNote || null
      });

      if (error) throw error;

      toast({
        title: "Credits added",
        description: `Successfully added ${creditAmount} credits to ${selectedUser.email}`
      });

      setSelectedUser(null);
      setCreditAmount('');
      setAdminNote('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add credits"
      });
    }
  };

  const handleRefundPayment = async (paymentId: string, amount: number) => {
    try {
      const { error } = await supabase.rpc('process_payment_refund', {
        payment_id: paymentId,
        refund_amount: amount,
        refund_reason: 'Admin initiated refund'
      });

      if (error) throw error;

      toast({
        title: "Refund processed",
        description: "Payment refund has been processed successfully"
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process refund"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      unread: 'destructive',
      read: 'secondary',
      replied: 'default'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Master Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats?.active_users || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">{stats?.total_analyses || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats?.total_revenue || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Messages</p>
                <p className="text-2xl font-bold">{stats?.pending_messages || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="messages">Messages & Support</TabsTrigger>
            <TabsTrigger value="payments">Payments & Refunds</TabsTrigger>
            <TabsTrigger value="referrals">Referral System</TabsTrigger>
            <TabsTrigger value="payments-health">Payments Health</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <EnhancedUserManagement 
              users={users} 
              onUserUpdate={fetchDashboardData}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Support Messages</h3>
                  <Button onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{message.name}</p>
                            <p className="text-sm text-muted-foreground">{message.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{message.subject}</TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell>{new Date(message.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View & Reply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Payments & Refunds</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} placeholder="Search payment ID or email..." className="pl-8 w-72" />
                    </div>
                    <select className="border rounded h-9 px-2 text-sm" value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                    <Input type="date" value={paymentFrom} onChange={e => setPaymentFrom(e.target.value)} className="w-40" />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input type="date" value={paymentTo} onChange={e => setPaymentTo(e.target.value)} className="w-40" />
                    <Button onClick={fetchDashboardData}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.payment_provider_id || payment.stripe_session_id || payment.id}</TableCell>
                        <TableCell className="text-sm">{payment.profiles?.email || payment.user_id.slice(0,8) + '...'}</TableCell>
                        <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{payment.credits_purchased}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method}</TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              await supabase.functions.invoke('payment-notification', { body: { userId: payment.user_id, paymentId: payment.id, credits: payment.credits_purchased } });
                              toast({ title: 'Receipt resent', description: 'Payment receipt email has been resent.' });
                            } catch (e) {
                              toast({ variant: 'destructive', title: 'Failed', description: 'Could not resend receipt.' });
                            }
                          }}>Resend</Button>
                          {payment.status === 'completed' && payment.refund_status === 'none' && (
                            <Button size="sm" variant="destructive" onClick={() => handleRefundPayment(payment.id, payment.amount)}>Refund</Button>
                          )}
                          {payment.refund_status === 'refunded' && (
                            <Badge variant="secondary">Refunded</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Payments Health Tab */}
          <TabsContent value="payments-health">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Payments</h3>
                  <Button size="sm" variant="outline" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 20).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.payment_provider_id || p.stripe_session_id || p.id}</TableCell>
                        <TableCell className="text-sm">{p.profiles?.email || p.user_id.slice(0,8) + '...'}</TableCell>
                        <TableCell>${(p.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{p.credits_purchased}</TableCell>
                        <TableCell>{getPaymentStatusBadge(p.status)}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              await supabase.functions.invoke('payment-notification', {
                                body: { userId: p.user_id, paymentId: p.id, credits: p.credits_purchased }
                              });
                              toast({ title: 'Receipt resent', description: 'Payment receipt email has been resent.' });
                            } catch (e) {
                              toast({ variant: 'destructive', title: 'Failed', description: 'Could not resend receipt.' });
                            }
                          }}>Resend Receipt</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Dodo Test Mode</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sandbox Mode</p>
                      <p className="text-sm text-muted-foreground">Use Dodo sandbox API for test transactions</p>
                    </div>
                    <Button variant={dodoTestMode ? 'default' : 'outline'} onClick={() => setDodoTestMode(!dodoTestMode)}>
                      {dodoTestMode ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    When enabled, backend create-payment will call sandbox API. Ensure sandbox keys are configured.
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Webhook Events</h3>
                    <Badge variant="secondary">Last {webhookErrors.length} events</Badge>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {webhookErrors.map((e) => (
                      <div key={e.id} className="p-3 rounded border bg-muted/40">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{e.event_type}</span>
                          <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                        </div>
                        {e.metadata && (
                          <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(e.metadata, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                    {webhookErrors.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent webhook events.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Referral System</h3>
                  <Button onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Signup</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Credits Awarded</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-mono">{referral.referral_code}</TableCell>
                        <TableCell>{referral.referrer_id.slice(0, 8)}...</TableCell>
                        <TableCell>{referral.referred_id ? referral.referred_id.slice(0, 8) + '...' : 'Pending'}</TableCell>
                        <TableCell>
                          {referral.is_signup_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          {referral.is_payment_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          {referral.credits_awarded ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(referral.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reply to Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
                <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p><strong>Message:</strong></p>
                <p className="mt-2">{selectedMessage.message}</p>
              </div>
              
              <div>
                <Label htmlFor="reply">Your Reply</Label>
                <Textarea
                  id="reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReplyToMessage} disabled={!replyContent.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to user account. This action will immediately update the user's credit balance.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p><strong>User:</strong> {selectedUser.full_name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Current Credits:</strong> {selectedUser.credits}</p>
              </div>
              
              <div>
                <Label htmlFor="credits">Credits to Add</Label>
                <Input
                  id="credits"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter number of credits"
                />
              </div>
              
              <div>
                <Label htmlFor="note">Admin Note (Optional)</Label>
                <Input
                  id="note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Reason for adding credits"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCredits} disabled={!creditAmount}>
                  <Gift className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterAdminDashboard;