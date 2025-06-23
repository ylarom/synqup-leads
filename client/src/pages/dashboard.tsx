import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Users, Mail, Bell, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalAccounts: number;
  activePeople: number;
  messagesSent: number;
  activeTriggers: number;
}

interface RecentMessage {
  id: number;
  person: {
    firstName: string;
    lastName: string;
    account?: {
      name: string;
    };
  };
  subject: string;
  content: string;
  status: string;
  media: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{
    messages: RecentMessage[];
    total: number;
  }>({
    queryKey: ["/api/messages", { limit: 5 }],
  });

  const recentMessages = messagesData?.messages || [];

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalAccounts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm font-medium">+12%</span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active People</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.activePeople || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm font-medium">+8%</span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.messagesSent || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="text-purple-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm font-medium">+24%</span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Triggers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.activeTriggers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell className="text-orange-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-red-600 text-sm font-medium">-3%</span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Automation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 py-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm">Your recent messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">
                            {message.person.firstName} {message.person.lastName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {message.person.account && (
                          <p className="text-sm text-gray-600 mb-1">
                            {message.person.account.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {message.subject || message.content.substring(0, 100) + '...'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(message.status)}>
                            {message.status}
                          </Badge>
                          <Badge className={getMediaColor(message.media)}>
                            {message.media}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Automation Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Automation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">MessageBrain</p>
                    <p className="text-sm text-gray-600">Last run: 1h ago</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GoogleNewsTrigger</p>
                    <p className="text-sm text-gray-600">Last run: 45m ago</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">EmailSender</p>
                    <p className="text-sm text-gray-600">Last run: 3h ago</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Delayed</Badge>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    // TODO: Navigate to automation details
                    console.log('View automation details');
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
