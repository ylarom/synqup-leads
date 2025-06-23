import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building, MessageSquare, Bell, Bot, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white text-2xl h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                CRM Management
              </h1>
              <p className="text-gray-600">
                Sign in to manage your customer relationships
              </p>
            </div>

            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              variant="outline"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5 mr-3"
              />
              Continue with Google
            </Button>

            <div className="text-center mt-6 text-sm text-gray-500">
              Secure authentication via Google OAuth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful CRM Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Streamline your customer relationships with automated outreach, 
              AI-powered messaging, and comprehensive contact management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Account Management</h3>
              <p className="text-gray-600 text-sm">
                Organize and track your business accounts with detailed company information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-success h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Management</h3>
              <p className="text-gray-600 text-sm">
                Maintain comprehensive profiles of your business contacts and relationships.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-purple-600 h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Message Management</h3>
              <p className="text-gray-600 text-sm">
                Track all communications across email, social media, and other channels.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="text-warning h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Triggers</h3>
              <p className="text-gray-600 text-sm">
                Automated monitoring of news, social media, and important events.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="text-indigo-600 h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Messaging</h3>
              <p className="text-gray-600 text-sm">
                Generate personalized outreach messages using advanced AI technology.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-cyan-600 h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
              <p className="text-gray-600 text-sm">
                Track your outreach performance and relationship metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
