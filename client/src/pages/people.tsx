import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Filter, Edit, Eye, Trash2, Users, Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PersonForm from "@/components/forms/person-form";
import type { PersonWithAccount, Account } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PeopleData {
  people: PersonWithAccount[];
  total: number;
}

interface AccountsData {
  accounts: Account[];
  total: number;
}

export default function People() {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonWithAccount | null>(null);
  const { toast } = useToast();

  const limit = 20;
  const offset = page * limit;

  const { data, isLoading, error } = useQuery<PeopleData>({
    queryKey: ["/api/people", limit, offset, search, accountFilter],
    enabled: true,
    retry: false,
  });

  const { data: accountsData } = useQuery<AccountsData>({
    queryKey: ["/api/accounts", 100],
    enabled: true,
    retry: false,
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/people/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({
        title: "Success",
        description: "Person deleted successfully",
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
        description: "Failed to delete person",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (person: PersonWithAccount) => {
    if (confirm(`Are you sure you want to delete ${person.firstName} ${person.lastName}?`)) {
      deletePersonMutation.mutate(person.id);
    }
  };

  const handlePersonSaved = () => {
    setIsAddDialogOpen(false);
    setEditingPerson(null);
    queryClient.invalidateQueries({ queryKey: ["/api/people"] });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderSocialLinks = (person: PersonWithAccount) => {
    const links = [];
    
    if (person.linkedin) {
      links.push(
        <a
          key="linkedin"
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      );
    }
    
    if (person.twitter) {
      links.push(
        <a
          key="twitter"
          href={person.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
        >
          <Twitter className="h-4 w-4" />
        </a>
      );
    }
    
    if (person.instagram) {
      links.push(
        <a
          key="instagram"
          href={person.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-800"
        >
          <Instagram className="h-4 w-4" />
        </a>
      );
    }
    
    if (person.facebook) {
      links.push(
        <a
          key="facebook"
          href={person.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-800 hover:text-blue-900"
        >
          <Facebook className="h-4 w-4" />
        </a>
      );
    }
    
    return links.length > 0 ? (
      <div className="flex gap-2">{links}</div>
    ) : (
      <span className="text-gray-400">-</span>
    );
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (error && isUnauthorizedError(error)) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage your contacts and relationships</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl mx-4">
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <PersonForm onSaved={handlePersonSaved} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {/* Search and Filters */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Accounts</SelectItem>
                    {accountsData?.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : !data?.people.length ? (
            <div className="text-center py-12 px-4">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
              <p className="text-gray-500 mb-4 text-sm md:text-base">
                {search ? "No people match your search." : "Get started by adding your first contact."}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Social</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {data.people.map((person) => (
                    <TableRow key={person.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {getInitials(person.firstName, person.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">
                              {person.firstName} {person.lastName}
                            </div>
                            {person.title && (
                              <div className="text-sm text-gray-600">{person.title}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {person.account ? (
                          <span className="text-gray-900">{person.account.name}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {person.email && (
                            <div className="text-sm text-gray-900">{person.email}</div>
                          )}
                          {person.phone && (
                            <div className="text-sm text-gray-600">{person.phone}</div>
                          )}
                          {!person.email && !person.phone && (
                            <span className="text-gray-400 text-sm">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderSocialLinks(person)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {person.createdAt && formatDistanceToNow(new Date(person.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPerson(person)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(person)}
                            disabled={deletePersonMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="divide-y divide-gray-200">
                  {data.people.map((person) => (
                    <div key={person.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {getInitials(person.firstName, person.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {person.firstName} {person.lastName}
                            </div>
                            {person.title && (
                              <div className="text-sm text-gray-600 truncate">{person.title}</div>
                            )}
                            {person.account && (
                              <div className="text-sm text-gray-500 truncate">{person.account.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPerson(person)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(person)}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {(person.email || person.phone) && (
                        <div className="space-y-1">
                          {person.email && (
                            <div className="text-sm text-gray-900">{person.email}</div>
                          )}
                          {person.phone && (
                            <div className="text-sm text-gray-600">{person.phone}</div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>{renderSocialLinks(person)}</div>
                        <div className="text-xs text-gray-500">
                          {person.createdAt && formatDistanceToNow(new Date(person.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 md:p-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
                      Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} people
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0}
                        className="px-2 md:px-4"
                      >
                        Previous
                      </Button>
                      <div className="hidden sm:flex gap-2">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = page < 3 ? i : page - 2 + i;
                          if (pageNum >= totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum + 1}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="sm:hidden">
                        <span className="text-sm text-gray-500 px-2">
                          {page + 1} of {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-2 md:px-4"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPerson} onOpenChange={() => setEditingPerson(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
          </DialogHeader>
          {editingPerson && (
            <PersonForm
              person={editingPerson}
              onSaved={handlePersonSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
