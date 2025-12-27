import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadsTable({ leads, loading, onView, onEdit, onDelete }: LeadsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading leads">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/60 rounded animate-pulse" />
        ))}
        <span className="sr-only">Loading leads...</span>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <div className="text-muted-foreground text-lg mb-2">No leads found</div>
        <div className="text-muted-foreground/70">Start by adding your first lead</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile card view for small screens */}
      <div className="block sm:hidden">
        <div className="space-y-4 p-4">
          {leads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-card border rounded-lg p-4 shadow-sm cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onView(lead)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                </div>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(lead)}
                    aria-label={`View details for ${lead.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(lead)}
                    aria-label={`Edit ${lead.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(lead)}
                    className="text-destructive hover:text-destructive/80"
                    aria-label={`Delete ${lead.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="text-xs text-muted-foreground">
                <div>{lead.insuranceInterest}</div>
                <div>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Phone</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Insurance Interest</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Priority</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Date Added</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow 
                key={lead.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onView(lead)}
              >
                <TableCell className="font-medium">
                  <div className="truncate max-w-32">{lead.name}</div>
                </TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell className="hidden lg:table-cell">{lead.insuranceInterest}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <PriorityBadge priority={lead.priority} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(lead)}
                      aria-label={`View details for ${lead.name}`}
                      className="focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(lead)}
                      aria-label={`Edit ${lead.name}`}
                      className="focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(lead)}
                      className="text-destructive hover:text-destructive/80 focus:ring-2 focus:ring-destructive focus:ring-offset-1"
                      aria-label={`Delete ${lead.name}`}
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
    </div>
  );
}