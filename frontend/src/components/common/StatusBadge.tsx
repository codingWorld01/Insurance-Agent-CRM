import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
export type Priority = 'Hot' | 'Warm' | 'Cold';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const statusConfig: Record<LeadStatus, { className: string }> = {
  New: { className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100' },
  Contacted: { className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100' },
  Qualified: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100' },
  Won: { className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' },
  Lost: { className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' },
};

const priorityConfig: Record<Priority, { className: string; emoji: string }> = {
  Hot: { className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100', emoji: '🔥' },
  Warm: { className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100', emoji: '☀️' },
  Cold: { className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100', emoji: '❄️' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Handle undefined or invalid status
  if (!status || !statusConfig[status]) {
    return (
      <Badge 
        variant="outline"
        className={cn('bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100', className)}
      >
        Unknown
      </Badge>
    );
  }

  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline"
      className={cn(config.className, className)}
    >
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  // Handle undefined or invalid priority
  if (!priority || !priorityConfig[priority]) {
    return (
      <Badge 
        variant="outline"
        className={cn('bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100', className)}
      >
        Unknown
      </Badge>
    );
  }

  const config = priorityConfig[priority];
  
  return (
    <Badge 
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.emoji} {priority}
    </Badge>
  );
}