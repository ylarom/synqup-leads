import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PersonForm from "@/components/forms/person-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { PersonWithAccount } from "@shared/schema";

export default function EditPerson() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const personId = params.id;

  const { data: person, isLoading, error } = useQuery<PersonWithAccount>({
    queryKey: [`/api/people/${personId}`],
    enabled: !!personId,
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const handleSaved = () => {
    toast({
      title: "Success",
      description: "Person updated successfully",
    });
    setLocation("/people");
  };

  const handleCancel = () => {
    setLocation("/people");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Person not found</h2>
          <p className="text-gray-600 mb-4">The person you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/people")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to People
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to People
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Person</h1>
        <p className="text-gray-600 mt-2">
          Update {person.firstName} {person.lastName}'s information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Person Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonForm person={person} onSaved={handleSaved} />
        </CardContent>
      </Card>
    </div>
  );
}