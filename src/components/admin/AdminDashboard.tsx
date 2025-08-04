import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Activity,
  Shield,
  UserCog,
  Trash2,
  Edit3,
  Calendar,
  ChevronDown,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  PieChart,
  DollarSign,
  Clock,
  Key,
  Lock,
  Unlock,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface ExtendedUserProfile {
  id: string;
  full_name: string | null;
  email: string;
  credits: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  email_verified: boolean;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  roles: Array<{
    id: string;
    role: 'admin' | 'user';
    created_at: string;
  }>;
  total_analyses: number;
  total_spent: number;
  last_activity: string | null;
  status: 'active' | 'suspended' | 'locked';
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  admin_notes: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits_amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  related_payment_id: string | null;
  related_analysis_id: string | null;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  unreadMessages: number;
  totalRevenue: number;
  totalCreditsDistributed: number;
  totalAnalyses: number;
  averageCreditsPerUser: number;
  userGrowthRate: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Data states
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    unreadMessages: 0,
    totalRevenue: 0,
    totalCreditsDistributed: 0,
    totalAnalyses: 0,
    averageCreditsPerUser: 0,
    userGrowthRate: 0,
    systemHealth: 'good'
  });

  // Filter and search states
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [messageFilter, setMessageFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  
  // Form states
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    credits: 0,
    email_verified: true,
    role: 'user' as 'admin' | 'user'
  });
  const [creditForm, setCreditForm] = useState({
    amount: '',
    note: '',
    type: 'admin_grant'
  });
  const [messageResponse, setMessageResponse] = useState('');

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

    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUsersWithDetails(),
        loadContactMessages(),
        loadCreditTransactions(),
        loadAnalytics()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Real-time subscription setup
  const setupRealtimeSubscriptions = useCallback(() => {
    const profilesChannel = supabase
      .channel('admin-profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsersWithDetails();
      })
      .subscribe();

    const rolesChannel = supabase
      .channel('admin-roles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        loadUsersWithDetails();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        loadContactMessages();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const loadUsersWithDetails = async () => {
    try {
      // Load user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) throw profileError;

      // Load user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Load additional user statistics
      const userIds = profiles?.map(p => p.id) || [];
      
      const [analysesData, paymentsData] = await Promise.all([
        supabase
          .from('resume_analyses')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('payments')
          .select('user_id, amount')
          .eq('status', 'completed')
          .in('user_id', userIds)
      ]);

      // Process the data
      const processedUsers = (profiles || []).map(profile => {
        const userAnalyses = analysesData.data?.filter(a => a.user_id === profile.id) || [];
        const userPayments = paymentsData.data?.filter(p => p.user_id === profile.id) || [];
        const profileRoles = userRoles?.filter(role => role.user_id === profile.id) || [];
        const totalSpent = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          ...profile,
          roles: profileRoles.map(role => ({
            id: role.user_id,
            role: role.role,
            created_at: role.created_at
          })),
          total_analyses: userAnalyses.length,
          total_spent: totalSpent,
          last_activity: profile.last_login,
          status: profile.locked_until && new Date(profile.locked_until) > new Date() 
            ? 'locked' 
            : profile.failed_login_attempts >= 5 
            ? 'suspended' 
            : 'active'
        } as ExtendedUserProfile;
      });

      setUsers(processedUsers);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message,
      });
    }
  };

  const loadContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactMessages((data || []) as ContactMessage[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading messages",
        description: error.message,
      });
    }
  };

  const loadCreditTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credits_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCreditTransactions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading transactions",
        description: error.message,
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        userCount,
        newUsersCount,
        messageCount,
        analysesCount,
        paymentsData,
        creditsData
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString().split('T')[0]),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true })
          .eq('status', 'unread'),
        supabase.from('resume_analyses').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('credits_ledger').select('credits_amount, transaction_type')
      ]);

      const totalRevenue = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalCreditsDistributed = creditsData.data
        ?.filter(c => c.transaction_type === 'admin_grant')
        ?.reduce((sum, c) => sum + c.credits_amount, 0) || 0;

      setAnalytics({
        totalUsers: userCount.count || 0,
        activeUsers: Math.floor((userCount.count || 0) * 0.7), // Estimated
        newUsersToday: newUsersCount.count || 0,
        unreadMessages: messageCount.count || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents
        totalCreditsDistributed,
        totalAnalyses: analysesCount.count || 0,
        averageCreditsPerUser: (userCount.count || 0) > 0 
          ? Math.round(totalCreditsDistributed / (userCount.count || 1)) 
          : 0,
        userGrowthRate: 12.5, // Mock data - would need historical data
        systemHealth: 'good'
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading analytics",
        description: error.message,
      });
    }
  };

  const createUser = async () => {
    try {
      if (!userForm.email || !userForm.full_name) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Email and name are required",
        });
        return;
      }

      // Create profile directly (user will sign up through normal flow)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: userForm.full_name,
          email: userForm.email,
          credits: userForm.credits || 0,
          email_verified: userForm.email_verified
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileData.id,
          role: userForm.role
        });

      if (roleError) throw roleError;

      toast({
        title: "User Profile Created",
        description: `Profile for ${userForm.email} created successfully. User will need to sign up through the normal flow.`,
      });

      setUserForm({ full_name: '', email: '', credits: 0, email_verified: true, role: 'user' });
      setShowUserDialog(false);
      await loadUsersWithDetails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating user profile",
        description: error.message,
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // First remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });

      await loadUsersWithDetails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message,
      });
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      const lockUntil = new Date();
      lockUntil.setDate(lockUntil.getDate() + 30); // 30 day suspension

      const { error } = await supabase
        .from('profiles')
        .update({ locked_until: lockUntil.toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Suspended",
        description: "User has been suspended for 30 days",
      });

      await loadUsersWithDetails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error suspending user",
        description: error.message,
      });
    }
  };

  const unsuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          locked_until: null,
          failed_login_attempts: 0
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Unsuspended",
        description: "User has been reactivated",
      });

      await loadUsersWithDetails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error unsuspending user",
        description: error.message,
      });
    }
  };

  const addCreditsToUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-add-credits', {
        body: {
          target_user_id: userId,
          credits_to_add: parseInt(creditForm.amount),
          admin_note: creditForm.note || 'Credits added by admin'
        }
      });

      if (error) throw error;

      toast({
        title: "Credits Added",
        description: `${creditForm.amount} credits added successfully`,
      });

      setCreditForm({ amount: '', note: '', type: 'admin_grant' });
      setSelectedUser(null);
      setShowCreditDialog(false);
      await loadUsersWithDetails();
      await loadCreditTransactions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding credits",
        description: error.message,
      });
    }
  };

  const respondToMessage = async (messageId: string) => {
    try {
      // Update message status directly
      const { error } = await supabase
        .from('contact_messages')
        .update({
          status: 'replied',
          admin_notes: messageResponse,
          responded_by: user?.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message Responded",
        description: "Response recorded successfully",
      });

      setMessageResponse('');
      setShowMessageDialog(false);
      await loadContactMessages();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error responding to message",
        description: error.message,
      });
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Message marked as ${newStatus}`,
      });

      await loadContactMessages();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  // Filter and sort functions
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesFilter = userFilter === 'all' || 
                           (userFilter === 'admin' && user.roles.some(r => r.role === 'admin')) ||
                           (userFilter === 'user' && user.roles.every(r => r.role === 'user')) ||
                           (userFilter === 'suspended' && user.status === 'suspended') ||
                           (userFilter === 'locked' && user.status === 'locked');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aVal = a[sortField as keyof ExtendedUserProfile];
      const bVal = b[sortField as keyof ExtendedUserProfile];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -direction : direction;
    });

  const filteredMessages = contactMessages.filter(message => 
    messageFilter === 'all' || message.status === messageFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'locked': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
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
      {/* Enhanced Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Crown className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Master Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Advanced User Management & CRM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut();
                    navigate('/');
                    toast({
                      title: "Logged out successfully",
                      description: "You have been logged out of your account",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Logout failed",
                      description: "There was an error logging out",
                    });
                  }
                }}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Roles & Access</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Credits</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.newUsersToday} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalAnalyses} analyses completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      analytics.systemHealth === 'excellent' ? 'bg-green-500' :
                      analytics.systemHealth === 'good' ? 'bg-blue-500' :
                      analytics.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-2xl font-bold capitalize">{analytics.systemHealth}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.unreadMessages} pending messages
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and additional analytics would go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-16 w-16 mx-auto mb-4" />
                    Chart component would be integrated here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                    Chart component would be integrated here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Users Management */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowUserDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Analyses</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} className={getRoleColor(role.role)}>
                              {role.role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>{user.total_analyses}</TableCell>
                      <TableCell>${(user.total_spent / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        {user.last_activity 
                          ? new Date(user.last_activity).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowUserDialog(true);
                            }}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setCreditForm({ amount: '', note: '', type: 'admin_grant' });
                              // Open the credit dialog immediately
                              setShowCreditDialog(true);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Credits
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => suspendUser(user.id)}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => unsuspendUser(user.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Role & Access Management */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{user.full_name || user.email}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="space-x-2">
                          {user.roles.map((role) => (
                            <Badge key={role.id} className={getRoleColor(role.role)}>
                              {role.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={user.roles[0]?.role || 'user'}
                          onValueChange={(value: 'admin' | 'user') => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Messages */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex items-center space-x-4">
              <Select value={messageFilter} onValueChange={setMessageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter messages" />
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
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.name}</div>
                          <div className="text-sm text-muted-foreground">{message.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{message.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={message.status === 'unread' ? 'destructive' : 'secondary'}>
                          {message.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(message.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowMessageDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {message.status === 'unread' && (
                                <DropdownMenuItem onClick={() => updateMessageStatus(message.id, 'read')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              {message.status !== 'replied' && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMessage(message);
                                  setShowMessageDialog(true);
                                }}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>
                              )}
                              {message.status !== 'archived' && (
                                <DropdownMenuItem onClick={() => updateMessageStatus(message.id, 'archived')}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Enhanced Credits Management */}
          <TabsContent value="credits" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Credit Management</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor and manage user credits across the system
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setCreditForm({ amount: '', note: '', type: 'admin_grant' });
                  setShowCreditDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Credits to User
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Credits Distributed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalCreditsDistributed}</div>
                  <p className="text-sm text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Credits per User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.averageCreditsPerUser}</div>
                  <p className="text-sm text-muted-foreground">Current average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.activeUsers}</div>
                  <p className="text-sm text-muted-foreground">With credits</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Credit Transactions</CardTitle>
                <CardDescription>
                  Monitor all credit transactions across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditTransactions.map((transaction) => {
                      const user = users.find(u => u.id === transaction.user_id);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="font-medium">
                              {user?.full_name || user?.email || 'Unknown User'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.transaction_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={
                              transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'
                            }>
                              {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.balance_after}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Manage system-wide settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Security Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-email-verification">Require Email Verification</Label>
                        <Switch id="require-email-verification" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-2fa">Enable Two-Factor Authentication</Label>
                        <Switch id="enable-2fa" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-suspend">Auto-suspend after failed attempts</Label>
                        <Switch id="auto-suspend" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-4">System Maintenance</h4>
                    <div className="space-y-4">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export User Data
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Users
                      </Button>
                      <Button variant="destructive">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        System Maintenance Mode
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      
      {/* User Creation/Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
                      <DialogHeader>
              <DialogTitle>Create User Profile</DialogTitle>
              <DialogDescription>
                Create a new user profile. The user will need to sign up through the normal authentication flow.
              </DialogDescription>
            </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="credits">Initial Credits</Label>
              <Input
                id="credits"
                type="number"
                value={userForm.credits}
                onChange={(e) => setUserForm({...userForm, credits: parseInt(e.target.value) || 0})}
                placeholder="Enter initial credits"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={userForm.role} onValueChange={(value: 'admin' | 'user') => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email_verified"
                checked={userForm.email_verified}
                onCheckedChange={(checked) => setUserForm({...userForm, email_verified: checked as boolean})}
              />
              <Label htmlFor="email_verified">Email Verified</Label>
            </div>
          </div>
                      <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowUserDialog(false);
                setUserForm({ full_name: '', email: '', credits: 0, email_verified: true, role: 'user' });
              }}>
                Cancel
              </Button>
              <Button 
                onClick={createUser}
                disabled={!userForm.email || !userForm.full_name}
              >
                Create User Profile
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Addition Dialog */}
      <Dialog open={showCreditDialog && !!selectedUser} onOpenChange={(open) => {
        if (!open) {
          setShowCreditDialog(false);
          setSelectedUser(null);
          setCreditForm({ amount: '', note: '', type: 'admin_grant' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedUser && (
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select onValueChange={(userId) => setSelectedUser(users.find(u => u.id === userId) || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedUser && (
              <div>
                <Label>Selected User</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.full_name || selectedUser.email}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="credits">Number of Credits</Label>
              <Input
                id="credits"
                type="number"
                value={creditForm.amount}
                onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                placeholder="Enter number of credits"
              />
            </div>
            <div>
              <Label htmlFor="note">Admin Note</Label>
              <Textarea
                id="note"
                value={creditForm.note}
                onChange={(e) => setCreditForm({...creditForm, note: e.target.value})}
                placeholder="Reason for adding credits..."
              />
            </div>
          </div>
                      <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSelectedUser(null);
                setCreditForm({ amount: '', note: '', type: 'admin_grant' });
                setShowCreditDialog(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedUser && addCreditsToUser(selectedUser.id)}
                disabled={!selectedUser || !creditForm.amount}
              >
                Add Credits
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedMessage && showMessageDialog && (
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <p className="text-sm">{selectedMessage.name} ({selectedMessage.email})</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <p className="text-sm">{selectedMessage.subject}</p>
              </div>
              <div>
                <Label>Message</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div>
                <Label htmlFor="response">Admin Response</Label>
                <Textarea
                  id="response"
                  value={messageResponse}
                  onChange={(e) => setMessageResponse(e.target.value)}
                  placeholder="Type your response..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Close
              </Button>
              <Button onClick={() => respondToMessage(selectedMessage.id)}>
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;