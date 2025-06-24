import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertPersonSchema, type PersonWithAccount, type InsertPerson, type Account } from "@shared/schema";

interface PersonFormProps {
  person?: PersonWithAccount;
  onSaved: () => void;
  onCancel?: () => void;
}

interface AccountsData {
  accounts: Account[];
  total: number;
}

export default function PersonForm({ person, onSaved, onCancel }: PersonFormProps) {
  const { toast } = useToast();
  const isEditing = !!person;
  const [newsResults, setNewsResults] = useState<any>(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);

  const { data: accountsData } = useQuery<AccountsData>({
    queryKey: ["/api/accounts", { limit: 100 }],
    retry: false,
  });

  const form = useForm<InsertPerson>({
    resolver: zodResolver(insertPersonSchema),
    defaultValues: {
      firstName: person?.firstName || "",
      lastName: person?.lastName || "",
      email: person?.email || "",
      phone: person?.phone || "",
      title: person?.title || "",
      accountId: person?.accountId || undefined,
      linkedin: person?.linkedin || "",
      facebook: person?.facebook || "",
      instagram: person?.instagram || "",
      twitter: person?.twitter || "",
      details: person?.details || "",
      description: person?.description || "",
    },
  });

  const savePersonMutation = useMutation({
    mutationFn: async (data: InsertPerson) => {
      if (isEditing) {
        const response = await apiRequest("PUT", `/api/people/${person.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/people", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Person ${isEditing ? "updated" : "created"} successfully`,
      });
      onSaved();
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
        description: `Failed to ${isEditing ? "update" : "create"} person`,
        variant: "destructive",
      });
    },
  });

  const runNewsSearchMutation = useMutation({
    mutationFn: async () => {
      if (!person?.id) {
        throw new Error("Person ID is required");
      }
      const response = await apiRequest("GET", `/api/run-trigger/news/person/${person.id}`);
      return response;
    },
    onSuccess: (data) => {
      setNewsResults(data);
      setIsNewsDialogOpen(true);
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
        description: "Failed to search news",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPerson) => {
    savePersonMutation.mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="VP of Marketing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select 
                  value={field.value?.toString() || "none"} 
                  onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No account</SelectItem>
                    {accountsData?.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Personal details, preferences, birthday, etc..." 
                  rows={2}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Professional background, relationship notes, etc..." 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={savePersonMutation.isPending}>
            {savePersonMutation.isPending ? "Saving..." : isEditing ? "Update Person" : "Create Person"}
          </Button>
          
          {isEditing && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => runNewsSearchMutation.mutate()}
              disabled={runNewsSearchMutation.isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              {runNewsSearchMutation.isPending ? "Searching..." : "Run Search News Trigger"}
            </Button>
          )}
        </div>
        </form>
      </Form>

      {/* News Search Results Dialog */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>News Search Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {newsResults && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Search Query:</h3>
              <code className="text-sm bg-white p-2 rounded border block">
                {newsResults.searchQuery}
              </code>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">JSON Response:</h3>
            <pre className="text-xs bg-white p-4 rounded border overflow-x-auto">
              {JSON.stringify(newsResults, null, 2)}
            </pre>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
