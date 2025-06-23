import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertMessageSchema, type MessageWithDetails, type InsertMessage, type PersonWithAccount } from "@shared/schema";

interface MessageFormProps {
  message?: MessageWithDetails;
  onSaved: () => void;
}

interface PeopleData {
  people: PersonWithAccount[];
  total: number;
}

const mediaOptions = [
  { value: "email", label: "Email" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "phone", label: "Phone" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "to_send", label: "To Send" },
  { value: "sent", label: "Sent" },
];

export default function MessageForm({ message, onSaved }: MessageFormProps) {
  const { toast } = useToast();
  const isEditing = !!message;

  const { data: peopleData } = useQuery<PeopleData>({
    queryKey: ["/api/people", { limit: 100 }],
    retry: false,
  });

  const form = useForm<InsertMessage>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      personId: message?.personId || 0,
      conversationId: message?.conversationId || null,
      triggerId: message?.triggerId || null,
      media: message?.media || "email",
      address: message?.address || "",
      from: message?.from || "us",
      subject: message?.subject || "",
      content: message?.content || "",
      status: message?.status || "draft",
    },
  });

  const selectedPersonId = form.watch("personId");
  const selectedMedia = form.watch("media");
  
  // Auto-fill address based on selected person and media
  const selectedPerson = peopleData?.people.find(p => p.id === selectedPersonId);
  
  const getAddressForMedia = (person: PersonWithAccount, media: string) => {
    switch (media) {
      case "email":
        return person.email || "";
      case "linkedin":
        return person.linkedin || "";
      case "twitter":
        return person.twitter || "";
      case "phone":
        return person.phone || "";
      default:
        return "";
    }
  };

  // Update address when person or media changes
  const handlePersonOrMediaChange = () => {
    if (selectedPerson && selectedMedia) {
      const address = getAddressForMedia(selectedPerson, selectedMedia);
      form.setValue("address", address);
    }
  };

  const saveMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      if (isEditing) {
        const response = await apiRequest("PUT", `/api/messages/${message.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/messages", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Message ${isEditing ? "updated" : "created"} successfully`,
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
        description: `Failed to ${isEditing ? "update" : "create"} message`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMessage) => {
    saveMessageMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="personId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient *</FormLabel>
                <Select 
                  value={field.value?.toString() || ""} 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handlePersonOrMediaChange();
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {peopleData?.people.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.firstName} {person.lastName}
                        {person.account && ` (${person.account.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="media"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medium *</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handlePersonOrMediaChange();
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mediaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Email address, social handle, etc." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Message subject line..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write your message content here..." 
                  rows={8}
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
          <Button type="submit" disabled={saveMessageMutation.isPending}>
            {saveMessageMutation.isPending ? "Saving..." : isEditing ? "Update Message" : "Create Message"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
