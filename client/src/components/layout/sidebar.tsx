import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Building, 
  Users, 
  MessageSquare, 
  Bell, 
  Bot,
  LogOut
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: Building,
  },
  {
    name: "People",
    href: "/people",
    icon: Users,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    name: "Triggers",
    href: "/triggers",
    icon: Bell,
  },
  {
    name: "Automation",
    href: "/automation",
    icon: Bot,
  },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getUserName = () => {
    if (!user) return "User";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">CRM System</h2>
            <p className="text-sm text-gray-500">{user?.role || "Admin User"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 px-4 py-3 h-auto ${
                    active
                      ? "text-primary bg-blue-50 font-medium hover:bg-blue-50 hover:text-primary"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setLocation(item.href)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {getUserName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || "user@company.com"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-0 h-auto text-gray-600 hover:text-primary"
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
