import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { Platform, PLATFORM_CONFIG, SocialAccount } from '@/types/post';
import { Link2, Unlink, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Meta only allows publishing to Pages and Instagram professional accounts (no personal profiles)
const REQUIREMENTS: Partial<Record<Platform, { text: string; linkLabel: string; href: string }>> = {
  facebook: {
    text: 'Publishing works with Facebook Pages you manage. Personal profiles are not supported by Meta.',
    linkLabel: 'Create a Page',
    href: 'https://www.facebook.com/pages/create',
  },
  instagram: {
    text: 'Requires an Instagram Business or Creator account linked to a Facebook Page. Personal accounts are not supported by Meta.',
    linkLabel: 'Switch to a professional account',
    href: 'https://help.instagram.com/502981923235522',
  },
};

interface ConnectionModeSelectorProps {
  platform: Platform;
  account?: SocialAccount;
  onConnect: (platform: Platform) => void;
  onDisconnect: (accountId: string, platform: Platform) => void;
}

export function ConnectionModeSelector({
  platform,
  account,
  onConnect,
  onDisconnect,
}: ConnectionModeSelectorProps) {
  const Icon = PlatformIcons[platform];
  const config = PLATFORM_CONFIG[platform];
  const isConnected = account?.connected ?? false;

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{config.label}</p>
          {isConnected && account?.username && (
            <p className="text-xs text-muted-foreground">{account.username}</p>
          )}
        </div>
        {isConnected && <Badge variant="outline">Connected</Badge>}
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
          isConnected ? 'border-primary bg-accent' : 'border-border'
        )}
      >
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Secure OAuth connection</p>
          <p className="text-xs text-muted-foreground">
            Sign in with {config.label} to let PostFlow Pro publish the posts you create and schedule.
          </p>
        </div>
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 text-destructive"
            onClick={() => onDisconnect(account!.id, platform)}
          >
            <Unlink className="h-3.5 w-3.5" /> Disconnect
          </Button>
        ) : (
          <Button size="sm" className="shrink-0 gap-1.5" onClick={() => onConnect(platform)}>
            <Link2 className="h-3.5 w-3.5" /> Connect
          </Button>
        )}
      </div>

      {REQUIREMENTS[platform] && (
        <p className="text-xs text-muted-foreground">
          {REQUIREMENTS[platform]!.text}{' '}
          <a
            href={REQUIREMENTS[platform]!.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {REQUIREMENTS[platform]!.linkLabel}
          </a>
        </p>
      )}
    </div>
  );
}
