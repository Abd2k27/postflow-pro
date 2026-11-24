import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformIcons } from '@/components/PlatformIcon';
import {
  Platform,
  PLATFORM_CONFIG,
  PLATFORM_MODE_SUPPORT,
  SocialAccount,
  ConnectionMode,
} from '@/types/post';
import { useEnableAssisted, useDisableAssisted } from '@/hooks/useAccounts';
import { CheckCircle2, Link2, Unlink, Hand, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const modes = PLATFORM_MODE_SUPPORT[platform];
  const enableAssisted = useEnableAssisted();
  const disableAssisted = useDisableAssisted();

  const isConnected = account?.connected ?? false;
  const currentMode: ConnectionMode | null = isConnected
    ? account!.connectionMode
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      {/* Platform header */}
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
        {currentMode && (
          <Badge variant="outline" className="capitalize">
            {currentMode === 'assisted' ? 'Assisted' : 'Auto (OAuth)'}
          </Badge>
        )}
      </div>

      {/* Mode options */}
      <div className="space-y-2">
        {/* Assisted mode */}
        {modes.includes('assisted') && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              currentMode === 'assisted'
                ? 'border-primary bg-accent'
                : 'border-border'
            )}
          >
            <Hand className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Assisted Mode</p>
              <p className="text-xs text-muted-foreground">
                No connection needed — we help you publish manually
              </p>
            </div>
            {currentMode === 'assisted' ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-destructive"
                onClick={() => disableAssisted.mutate(platform)}
                disabled={disableAssisted.isPending}
              >
                <Unlink className="h-3.5 w-3.5" /> Disable
              </Button>
            ) : currentMode !== 'auto' ? (
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => enableAssisted.mutate(platform)}
                disabled={enableAssisted.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Enable
              </Button>
            ) : null}
          </div>
        )}

        {/* Auto (OAuth) mode */}
        {modes.includes('auto') && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              currentMode === 'auto'
                ? 'border-primary bg-accent'
                : 'border-border'
            )}
          >
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Auto (OAuth){' '}
                <span className="text-xs font-normal text-muted-foreground">
                  — Advanced
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Automatic publishing via secure OAuth connection.
                {(platform === 'facebook' || platform === 'instagram') && (
                  <span className="block mt-1 font-medium text-primary/80">
                    Required for end-to-end publishing and account management.
                  </span>
                )}
              </p>
            </div>
            {currentMode === 'auto' ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-destructive"
                onClick={() => onDisconnect(account!.id, platform)}
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect
              </Button>
            ) : currentMode !== 'assisted' ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => onConnect(platform)}
              >
                <Link2 className="h-3.5 w-3.5" /> Connect
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
