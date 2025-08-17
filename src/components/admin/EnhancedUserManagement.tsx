import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  Phone,
  Mail,
  Calendar,
  Globe,
  Languages
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Activity {
  activity_date: string;
  activity_type: string;
  description: string;
  metadata: any;
}

interface EnhancedUserManagementProps {
  users: User[];
  onUserUpdate: () => void;
}

const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({ users, onUserUpdate }) => {
  const { toast } = useToast();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingActivity, setViewingActivity] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    status: '',
    subscription_tier: '',
    notes: '',
    timezone: '',
    language: '',
    is_active: true
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Initialize edit form when editing user changes
  useEffect(() => {
    if (editingUser) {
      setEditForm({
        full_name: editingUser.full_name || '',
        phone: editingUser.phone || '',
        status: editingUser.status,
        subscription_tier: editingUser.subscription_tier,
        notes: editingUser.notes || '',
        timezone: editingUser.timezone || 'UTC',
        language: editingUser.language || 'en',
        is_active: editingUser.is_active
      });
    }
  }, [editingUser]);

  // Fetch user activity
  const fetchUserActivity = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_user_activity', {
        target_user_id: userId,
        limit_count: 50
      });

      if (error) throw error;
      setUserActivity(data || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user activity"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_update_user_profile', {
        target_user_id: editingUser.id,
        new_full_name: editForm.full_name || null,
        new_phone: editForm.phone || null,
        new_status: editForm.status || null,
        new_subscription_tier: editForm.subscription_tier || null,
        new_notes: editForm.notes || null,
        new_timezone: editForm.timezone || null,
        new_language: editForm.language || null,
        new_is_active: editForm.is_active
      });

      if (error) throw error;

      toast({
        title: "User updated",
        description: `Successfully updated ${editingUser.email}`
      });

      setEditingUser(null);
      onUserUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user"
      });
    } finally {
      setLoading(false);
    }
  };

  // Suspend/unsuspend user
  const handleSuspendUser = async (user: User, suspend: boolean, reason?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_suspend_user', {
        target_user_id: user.id,
        suspend,
        reason: reason || null
      });

      if (error) throw error;

      toast({
        title: suspend ? "User suspended" : "User unsuspended",
        description: `Successfully ${suspend ? 'suspended' : 'unsuspended'} ${user.email}`
      });

      onUserUpdate();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${suspend ? 'suspend' : 'unsuspend'} user`
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete user account
  const handleDeleteUser = async (user: User, permanent: boolean = false, reason?: string) => {
    if (!confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'soft delete'} ${user.email}? This action ${permanent ? 'cannot be undone' : 'can be reversed'}.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_delete_user_account', {
        target_user_id: user.id,
        permanent,
        reason: reason || null
      });

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `Successfully ${permanent ? 'permanently ' : ''}deleted ${user.email}`
      });

      onUserUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add credits to user
  const handleAddCredits = async (user: User, credits: number, note?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_add_credits', {
        target_user_id: user.id,
        credits_to_add: credits,
        admin_note: note || null
      });

      if (error) throw error;

      toast({
        title: "Credits added",
        description: `Successfully added ${credits} credits to ${user.email}`
      });

      onUserUpdate();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add credits"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    const variants = {
      active: 'default',
      suspended: 'destructive',
      banned: 'destructive',
      pending: 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  // Get tier badge
  const getTierBadge = (tier: string) => {
    const variants = {
      free: 'secondary',
      basic: 'default',
      premium: 'default',
      enterprise: 'default'
    } as const;
    
    return <Badge variant={variants[tier as keyof typeof variants] || 'secondary'}>{tier}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTierFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Users ({filteredUsers.length})</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {user.timezone || 'UTC'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status, user.is_active)}
                    </TableCell>
                    <TableCell>
                      {getTierBadge(user.subscription_tier)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{user.credits}</span>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <span className="text-sm">
                          {new Date(user.last_login).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingActivity(user);
                            fetchUserActivity(user.id);
                          }}
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status, selectedUser.is_active)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subscription Tier</Label>
                  <div className="mt-1">{getTierBadge(selectedUser.subscription_tier)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Credits</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedUser.credits}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.timezone || 'UTC'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.language || 'en'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedUser.notes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedUser.notes}</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const credits = prompt('How many credits to add?');
                    const note = prompt('Add a note (optional):');
                    if (credits && !isNaN(parseInt(credits))) {
                      handleAddCredits(selectedUser, parseInt(credits), note || undefined);
                    }
                  }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
                
                {selectedUser.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Reason for suspension:');
                      if (reason) {
                        handleSuspendUser(selectedUser, true, reason);
                      }
                    }}
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleSuspendUser(selectedUser, false)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Unsuspend
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Reason for deletion:');
                    if (reason) {
                      handleDeleteUser(selectedUser, false, reason);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Soft Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tier">Subscription Tier</Label>
                  <Select value={editForm.subscription_tier} onValueChange={(value) => setEditForm({ ...editForm, subscription_tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-timezone">Timezone</Label>
                  <Input
                    id="edit-timezone"
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-language">Language</Label>
                  <Input
                    id="edit-language"
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Admin Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                <Label htmlFor="edit-active">Account Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} disabled={loading}>
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog open={!!viewingActivity} onOpenChange={() => setViewingActivity(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Recent activity for {viewingActivity?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading activity...</div>
            ) : userActivity.length > 0 ? (
              userActivity.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{activity.activity_type}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.activity_date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <pre>{JSON.stringify(activity.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity found for this user.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;