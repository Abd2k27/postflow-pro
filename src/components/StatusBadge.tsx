import { PublishStatus } from '@/types/post';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, XCircle, UserCheck } from 'lucide-react';

const statusConfig: Record<PublishStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  publishing: { label: 'Publishing', icon: Loader2, className: 'bg-warning/10 text-warning' },
  published: { label: 'Published', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  awaiting_confirmation: { label: 'Awaiting Confirmation', icon: UserCheck, className: 'bg-blue-500/10 text-blue-600' },
};

export function StatusBadge({ status }: { status: PublishStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 border-0 ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'publishing' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
