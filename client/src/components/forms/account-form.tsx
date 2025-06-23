import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertAccountSchema, type Account, type InsertAccount } from "@shared/schema";

interface AccountFormProps {
  account?: Account;
  onSaved: () => void;
}

export default function AccountForm({ account, onSaved }: AccountFormProps) {
  const { toast } = useToast();
  const isEditing = !!account;

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: account?.name || "",
      field: account?.field || "",
      address: account?.address || "",
      website: account?.website || "",
      description: account?.description || "",
    },
  });

  const saveAccountMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      if (isEditing) {
        const response = await apiRequest("PUT", `/api/accounts/${account.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/accounts", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Account ${isEditing ? "updated" : "created"} successfully`,
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
        description: `Failed to ${isEditing ? "update" : "create"} account`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAccount) => {
    saveAccountMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. TechCorp Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="field"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Technology, Healthcare" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Company address..." 
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
                  placeholder="Company description, notes, or additional information..." 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSaved}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveAccountMutation.isPending}>
            {saveAccountMutation.isPending ? "Saving..." : isEditing ? "Update Account" : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
