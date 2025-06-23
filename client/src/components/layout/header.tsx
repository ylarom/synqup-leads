import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Bell, Plus, Menu } from "lucide-react";
import Sidebar from "./sidebar";

const pageInfo = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of your CRM activities",
  },
  "/accounts": {
    title: "Accounts",
    subtitle: "Manage your business accounts",
  },
  "/people": {
    title: "People",
    subtitle: "Manage your contacts and relationships",
  },
  "/messages": {
    title: "Messages",
    subtitle: "View and manage all communications",
  },
  "/triggers": {
    title: "Triggers",
    subtitle: "Monitor and manage automation triggers",
  },
  "/automation": {
    title: "Automation",
    subtitle: "Configure automated workflows",
  },
};

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const currentPage = pageInfo[location as keyof typeof pageInfo] || {
    title: "CRM System",
    subtitle: "Customer Relationship Management",
  };

  const handleAddNew = () => {
    // This would open different modals based on current page
    console.log("Add new item for current page:", location);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{currentPage.title}</h1>
            <p className="text-gray-600 mt-1 hidden sm:block">{currentPage.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 lg:w-80 pl-10 pr-4"
            />
          </div>

          {/* Search Button for Mobile */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Search className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              3
            </Badge>
          </Button>

          {/* Add Button */}
          <Button onClick={handleAddNew} size="sm" className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <Button onClick={handleAddNew} size="sm" className="sm:hidden">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
