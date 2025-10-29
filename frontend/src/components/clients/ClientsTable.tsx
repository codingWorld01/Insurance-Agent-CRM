import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow, differenceInYears } from 'date-fns';

// Use Client type directly from types/index.ts

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({ clients, loading, onView, onEdit, onDelete }: ClientsTableProps) {
  const getAge = (client: Client): number => {
    // Use age from database if available, otherwise calculate from date of birth
    return client.age || differenceInYears(new Date(), new Date(client.dateOfBirth));
  };

  const getClientName = (client: Client): string => {
    // Use company name if available, otherwise use personal name
    if (client.companyName) {
      return client.companyName;
    }
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return fullName || client.name || 'Unnamed Client';
  };

  const getClientPhone = (client: Client): string => {
    // Use whatsappNumber or phoneNumber from unified model
    return client.whatsappNumber || client.phoneNumber || client.phone || '';
  };

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading clients">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/60 rounded animate-pulse" />
        ))}
        <span className="sr-only">Loading clients...</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <div className="text-muted-foreground text-lg mb-2">No clients found</div>
        <div className="text-muted-foreground/70">Start by adding your first client</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile card view for small screens */}
      <div className="block sm:hidden">
        <div className="space-y-4 p-4">
          {clients.map((client) => {
            return (
            <div key={client.id} className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{getClientName(client)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                  <p className="text-sm text-muted-foreground">{getClientPhone(client)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label={`Actions for ${getClientName(client)}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(client)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(client)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Age: {getAge(client)} years</div>
                <div>
                  Policies: {'policyCount' in client ? (client as Client & { policyCount: number }).policyCount : client.policies?.length || 0}
                </div>
                <div>{formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}</div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Email</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Phone</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Age</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Number of Policies</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Date Added</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              return (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <div className="truncate max-w-32">{getClientName(client)}</div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-40">{client.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{getClientPhone(client)}</TableCell>
                <TableCell className="hidden lg:table-cell">{getAge(client)} years</TableCell>
                <TableCell className="hidden md:table-cell">
                  {'policyCount' in client ? (client as Client & { policyCount: number }).policyCount : client.policies?.length || 0}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Actions for ${getClientName(client)}`}
                        className="focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(client)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}