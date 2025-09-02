import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  User,
  Calendar,
  Reply,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

interface MessageReply {
  id: string;
  contact_message_id: string;
  admin_user_id: string;
  reply_content: string;
  is_email_sent: boolean;
  email_status: string;
  created_at: string;
}

interface MessageWithReplies extends ContactMessage {
  replies: MessageReply[];
  reply_count: number;
}

const EnhancedMessageCenter = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithReplies | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    loadMessagesWithReplies();
  }, []);

  const loadMessagesWithReplies = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading contact messages with replies...');
      
      // Load contact messages
      const { data: contactMessages, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) {
        throw messagesError;
      }

      // Load all message replies
      const { data: allReplies, error: repliesError } = await supabase
        .from('message_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.warn('Could not load message replies:', repliesError);
      }

      // Combine messages with their replies
      const messagesWithReplies: MessageWithReplies[] = (contactMessages || []).map(message => {
        const messageReplies = (allReplies || []).filter(reply => reply.contact_message_id === message.id);
        
        return {
          ...message,
          replies: messageReplies,
          reply_count: messageReplies.length
        };
      });

      console.log('✅ Messages with replies loaded:', messagesWithReplies.length);
      setMessages(messagesWithReplies);

      toast({
        title: "✅ Messages Loaded",
        description: `Loaded ${messagesWithReplies.length} contact messages with ${allReplies?.length || 0} replies.`,
      });

    } catch (error) {
      console.error('❌ Error loading messages:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Messages",
        description: "Failed to load contact messages and replies.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewMessage = (message: MessageWithReplies) => {
    setSelectedMessage(message);
    setShowMessageDialog(true);
    setReplyContent('');
    
    // Mark as read if unread
    if (message.status === 'unread') {
      updateMessageStatus(message.id, 'read');
    }
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, status: status as any } : msg
        )
      );

    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim() || !user?.id) return;

    setSendingReply(true);
    try {
      console.log('🔄 Sending reply to message:', selectedMessage.id);
      console.log('🔄 Admin user ID:', user.id);

      // Use the admin-message-reply function which handles everything
      const { data: result, error: replyError } = await supabase.functions.invoke('admin-message-reply', {
        body: {
          contactMessageId: selectedMessage.id,
          replyContent: replyContent,
          sendEmail: true
        }
      });

      if (replyError) {
        throw replyError;
      }

      console.log('✅ Reply sent successfully:', result);
      setReplyContent('');
      setShowMessageDialog(false);
      
      const emailStatus = result?.emailResult?.error ? 
        "Reply saved but email failed to send" : 
        "Reply sent and email delivered successfully";
      
      toast({
        title: "✅ Reply Sent",
        description: emailStatus,
      });

      // Reload messages to show the new reply
      loadMessagesWithReplies();

    } catch (error) {
      console.error('❌ Error sending reply:', error);
      toast({
        variant: "destructive",
        title: "Failed to Send Reply",
        description: `Could not send reply: ${error.message}`,
      });
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string, replyCount: number) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied ({replyCount})</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading messages and replies...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message Center</h2>
          <p className="text-gray-600">Manage contact messages and replies</p>
        </div>
        <Button onClick={loadMessagesWithReplies} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{messages.length}</div>
                <div className="text-sm text-gray-500">Total Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{messages.filter(m => m.status === 'unread').length}</div>
                <div className="text-sm text-gray-500">Unread</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{messages.filter(m => m.status === 'replied').length}</div>
                <div className="text-sm text-gray-500">Replied</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{messages.reduce((sum, m) => sum + m.reply_count, 0)}</div>
                <div className="text-sm text-gray-500">Total Replies</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contact Messages ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Replies</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{message.name}</div>
                        <div className="text-sm text-gray-500">{message.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{message.subject}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(message.status, message.reply_count)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Reply className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{message.reply_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{new Date(message.created_at).toLocaleDateString()}</div>
                        {message.responded_at && (
                          <div className="text-xs text-green-600">
                            Replied: {new Date(message.responded_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewMessage(message)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No messages found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              View the complete conversation and send replies to the customer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              {/* Original Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Original Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">From</Label>
                      <p className="text-sm">{selectedMessage.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedMessage.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date</Label>
                      <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div>{getStatusBadge(selectedMessage.status, selectedMessage.reply_count)}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <p className="text-sm mt-1">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Message</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border">
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Replies History */}
              {selectedMessage.replies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reply History ({selectedMessage.replies.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMessage.replies.map((reply, index) => (
                        <div key={reply.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">Admin Reply #{index + 1}</span>
                              {reply.is_email_sent && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email Sent
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(reply.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm whitespace-pre-wrap">{reply.reply_content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Reply */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Send Reply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reply">Your Reply</Label>
                    <Textarea
                      id="reply"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                      Close
                    </Button>
                    <Button 
                      onClick={sendReply} 
                      disabled={!replyContent.trim() || sendingReply}
                    >
                      {sendingReply ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMessageCenter;
