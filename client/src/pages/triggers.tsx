import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Newspaper,
  Calendar,
  Users
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TriggerWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TriggersData {
  triggers: TriggerWithDetails[];
  total: number;
}

const statusTabs = [
  { value: "", label: "All", color: "bg-gray-100 text-gray-800" },
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "handled", label: "Handled", color: "bg-green-100 text-green-800" },
  { value: "ignored", label: "Ignored", color: "bg-gray-100 text-gray-800" },
];

export default function Triggers() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  const limit = 20;
  const offset = page * limit;

  const { data, isLoading, error } = useQuery<TriggersData>({
    queryKey: ["/api/triggers", limit, offset, statusFilter],
    retry: false,
  });

  const updateTriggerMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/triggers/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triggers"] });
      toast({
        title: "Success",
        description: "Trigger updated successfully",
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
        description: "Failed to update trigger",
        variant: "destructive",
      });
    },
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/triggers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triggers"] });
      toast({
        title: "Success",
        description: "Trigger deleted successfully",
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
        description: "Failed to delete trigger",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = (id: number, status: string) => {
    updateTriggerMutation.mutate({ id, status });
  };

  const handleDelete = (trigger: TriggerWithDetails) => {
    if (confirm("Are you sure you want to delete this trigger?")) {
      deleteTriggerMutation.mutate(trigger.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'handled':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'news':
        return 'bg-purple-100 text-purple-800';
      case 'birthday':
        return 'bg-pink-100 text-pink-800';
      case 'anniversary':
        return 'bg-indigo-100 text-indigo-800';
      case 'social_post':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      case 'birthday':
      case 'anniversary':
        return <Calendar className="h-4 w-4" />;
      case 'social_post':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'handled':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ignored':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Triggers</h1>
          <p className="text-gray-600 mt-1">Monitor and manage automation triggers</p>
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
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !data?.triggers.length ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No triggers found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `No ${statusFilter} triggers found.` : "Triggers will appear here as they are detected."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {data.triggers.map((trigger) => (
                  <div key={trigger.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        {trigger.person ? (
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {getInitials(trigger.person.firstName, trigger.person.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : trigger.account ? (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bell className="h-6 w-6 text-blue-600" />
                          </div>
                        ) : (
                          <Bell className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {trigger.person 
                                ? `${trigger.person.firstName} ${trigger.person.lastName}`
                                : trigger.account?.name || "System Trigger"
                              }
                            </h3>
                            {trigger.account && (
                              <span className="text-sm text-gray-500">
                                {trigger.account.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(trigger.status)}>
                                {getStatusIcon(trigger.status)}
                                <span className="ml-1">{trigger.status}</span>
                              </Badge>
                              <Badge className={getTriggerTypeColor(trigger.triggerType)}>
                                {getTriggerTypeIcon(trigger.triggerType)}
                                <span className="ml-1">{trigger.triggerType}</span>
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(trigger.createdAt), { addSuffix: true })}
                            </span>
                            <div className="flex gap-1">
                              {trigger.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(trigger.url!, '_blank')}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              {trigger.status === 'new' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(trigger.id, 'handled')}
                                    disabled={updateTriggerMutation.isPending}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(trigger.id, 'ignored')}
                                    disabled={updateTriggerMutation.isPending}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(trigger)}
                                disabled={deleteTriggerMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {trigger.media && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-600">
                              Source: {trigger.media}
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {trigger.content}
                          </p>
                        </div>
                        
                        {trigger.url && (
                          <div className="mt-3">
                            <a
                              href={trigger.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Source
                            </a>
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
                    Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} triggers
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
    </div>
  );
}
