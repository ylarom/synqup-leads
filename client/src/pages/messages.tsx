import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Eye, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MessageForm from "@/components/forms/message-form";
import type { MessageWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface MessagesData {
  messages: MessageWithDetails[];
  total: number;
}

const statusTabs = [
  { value: "", label: "All", color: "bg-gray-100 text-gray-800" },
  { value: "draft", label: "Drafts", color: "bg-yellow-100 text-yellow-800" },
  { value: "to_send", label: "To Send", color: "bg-blue-100 text-blue-800" },
  { value: "sent", label: "Sent", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
];

export default function Messages() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageWithDetails | null>(null);
  const { toast } = useToast();

  const limit = 20;
  const offset = page * limit;

  const { data, isLoading, error } = useQuery<MessagesData>({
    queryKey: ["/api/messages", limit, offset, statusFilter],
    retry: false,
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const sendDraftsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/messages/send-drafts");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: `${data.count} messages marked for sending`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send drafts",
        variant: "destructive",
      });
    },
  });

  const sendSingleMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/messages/${id}`, { status: "to_send" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Message marked for sending",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (message: MessageWithDetails) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate(message.id);
    }
  };

  const handleSendMessage = (message: MessageWithDetails) => {
    sendSingleMessageMutation.mutate(message.id);
  };

  const handleMessageSaved = () => {
    setIsAddDialogOpen(false);
    setEditingMessage(null);
    queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'to_send':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMediaColor = (media: string) => {
    switch (media) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'linkedin':
        return 'bg-purple-100 text-purple-800';
      case 'twitter':
        return 'bg-cyan-100 text-cyan-800';
      case 'phone':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'to_send':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (error && isUnauthorizedError(error)) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">View and manage all communications</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => sendDraftsMutation.mutate()}
            disabled={sendDraftsMutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700 border-green-600"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendDraftsMutation.isPending ? "Sending..." : "Send Drafts"}
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
              </DialogHeader>
              <MessageForm onSaved={handleMessageSaved} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        {/* Status Filter Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {statusTabs.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
                className={
                  statusFilter === tab.value
                    ? "bg-white text-primary shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-6 border-b">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !data?.messages.length ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `No ${statusFilter} messages found.` : "Start by composing your first message."}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Compose Message
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {data.messages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {message.person ? getInitials(message.person.firstName, message.person.lastName) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {message.person ? `${message.person.firstName} ${message.person.lastName}` : "Unknown Person"}
                            </h3>
                            {message.person?.account && (
                              <span className="text-sm text-gray-500">
                                {message.person.account.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(message.status)}>
                                {getStatusIcon(message.status)}
                                <span className="ml-1">{message.status}</span>
                              </Badge>
                              <Badge className={getMediaColor(message.media)}>
                                {message.media}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                            <div className="flex gap-1">
                              {message.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendMessage(message)}
                                  disabled={sendSingleMessageMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMessage(message)}
                                className="text-primary hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(message)}
                                disabled={deleteMessageMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {message.trigger && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">
                              Trigger: {message.trigger.triggerType} - {message.trigger.content.substring(0, 100)}...
                            </p>
                          </div>
                        )}
                        
                        {message.subject && (
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Subject: {message.subject}
                          </p>
                        )}
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {message.content.length > 300 
                              ? `${message.content.substring(0, 300)}...` 
                              : message.content
                            }
                          </p>
                        </div>
                        
                        {message.status === 'sent' && message.sentAt && (
                          <div className="mt-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">
                              Sent {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} messages
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = page < 3 ? i : page - 2 + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <MessageForm
              message={editingMessage}
              onSaved={handleMessageSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
