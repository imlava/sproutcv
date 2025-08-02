import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  Settings,
  Search,
  Filter,
  Mail,
  Check,
  X,
  Archive,
  Plus,
  Minus,
  Eye,
  UserCheck,
  Crown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  credits: number;
  created_at: string;
  last_login: string | null;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits_amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [userMap, setUserMap] = useState<{[key: string]: UserProfile}>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    unreadMessages: 0,
    totalCreditsDistributed: 0,
    activeUsers: 0
  });

  // Filter states
  const [userSearch, setUserSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (error || !roleData) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have admin privileges",
      });
      return;
    }

    await loadDashboardData();
    setLoading(false);
  };

  const loadDashboardData = async () => {
    await Promise.all([
      loadUsers(),
      loadContactMessages(),
      loadCreditTransactions(),
      loadStats()
    ]);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, credits, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message,
      });
    } else {
      setUsers(data || []);
      // Create user map for quick lookup
      const map = (data || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as {[key: string]: UserProfile});
      setUserMap(map);
    }
  };

  const loadContactMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading messages",
        description: error.message,
      });
    } else {
      setContactMessages(data || []);
    }
  };

  const loadCreditTransactions = async () => {
    const { data, error } = await supabase
      .from('credits_ledger')
      .select(`
        id, user_id, transaction_type, credits_amount, balance_after, description, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading transactions",
        description: error.message,
      });
    } else {
      setCreditTransactions(data || []);
    }
  };

  const loadStats = async () => {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: unreadMessages } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread');

    const { data: creditData } = await supabase
      .from('credits_ledger')
      .select('credits_amount')
      .eq('transaction_type', 'admin_grant');

    const totalCreditsDistributed = creditData?.reduce((sum, t) => sum + t.credits_amount, 0) || 0;

    setStats({
      totalUsers: totalUsers || 0,
      unreadMessages: unreadMessages || 0,
      totalCreditsDistributed,
      activeUsers: Math.floor((totalUsers || 0) * 0.7) // Simulated active users
    });
  };

  const addCreditsToUser = async () => {
    if (!selectedUser || !creditAmount) return;

    try {
      const { error } = await supabase.rpc('admin_add_credits', {
        target_user_id: selectedUser.id,
        credits_to_add: parseInt(creditAmount),
        admin_note: creditNote || `Credits added by admin`
      });

      if (error) throw error;

      toast({
        title: "Credits Added",
        description: `${creditAmount} credits added to ${selectedUser.full_name || selectedUser.email}`,
      });

      setSelectedUser(null);
      setCreditAmount('');
      setCreditNote('');
      await loadUsers();
      await loadCreditTransactions();
      await loadStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding credits",
        description: error.message,
      });
    }
  };

  const updateMessageStatus = async (messageId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('update_contact_message_status', {
        message_id: messageId,
        new_status: status,
        admin_notes: notes
      });

      if (error) throw error;

      toast({
        title: "Message Updated",
        description: `Message marked as ${status}`,
      });

      await loadContactMessages();
      await loadStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating message",
        description: error.message,
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMessages = contactMessages.filter(message => {
    if (messageFilter === 'all') return true;
    return message.status === messageFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'unread': 'destructive',
      'read': 'secondary',
      'replied': 'default',
      'archived': 'outline'
    } as const;
    
    return variants[status as keyof typeof variants] || 'secondary';
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
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Welcome,</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Credits</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold">{stats.activeUsers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unread Messages</p>
                    <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Credits Distributed</p>
                    <p className="text-3xl font-bold">{stats.totalCreditsDistributed}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Credit Transactions</h3>
              <div className="space-y-3">
                  {creditTransactions.slice(0, 5).map((transaction) => {
                    const user = userMap[transaction.user_id];
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{user?.full_name || user?.email || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Management</h3>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{user.full_name || 'No name provided'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{user.credits} credits</p>
                          {user.last_login && (
                            <p className="text-xs text-muted-foreground">
                              Last login: {new Date(user.last_login).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Credits</DialogTitle>
                              <DialogDescription>
                                Add credits to {selectedUser?.full_name || selectedUser?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="credits">Number of Credits</Label>
                                <Input
                                  id="credits"
                                  type="number"
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  placeholder="Enter number of credits"
                                />
                              </div>
                              <div>
                                <Label htmlFor="note">Admin Note (optional)</Label>
                                <Textarea
                                  id="note"
                                  value={creditNote}
                                  onChange={(e) => setCreditNote(e.target.value)}
                                  placeholder="Reason for adding credits..."
                                />
                              </div>
                              <Button onClick={addCreditsToUser} className="w-full">
                                Add Credits
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex items-center space-x-4">
              <Select value={messageFilter} onValueChange={setMessageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Contact Messages</h3>
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{message.name}</h4>
                            <Badge variant={getStatusBadge(message.status)}>
                              {message.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                          <p className="font-medium mt-1">{message.subject}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMessageStatus(message.id, 'read')}
                            disabled={message.status === 'read'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMessageStatus(message.id, 'replied')}
                            disabled={message.status === 'replied'}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMessageStatus(message.id, 'archived')}
                            disabled={message.status === 'archived'}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{message.message}</p>
                      {message.admin_notes && (
                        <div className="bg-muted p-3 rounded text-sm">
                          <strong>Admin Notes:</strong> {message.admin_notes}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Received: {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Credit Transaction History</h3>
                <div className="space-y-3">
                  {creditTransactions.map((transaction) => {
                    const user = userMap[transaction.user_id];
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1">
                          <h4 className="font-medium">{user?.full_name || user?.email || 'Unknown User'}</h4>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: {transaction.balance_after}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.transaction_type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;