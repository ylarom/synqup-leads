import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PersonForm from "@/components/forms/person-form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function AddPerson() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const handlePersonSaved = () => {
    toast({
      title: "Success",
      description: "Person added successfully",
    });
    setLocation("/people");
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 min-h-full pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/people")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Person</h1>
        <p className="text-gray-600 mt-1">Create a new contact in your CRM</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Fill in the details for the new contact. Required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm onSaved={handlePersonSaved} />
        </CardContent>
      </Card>
    </div>
  );
}