import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlatformIcons } from '@/components/PlatformIcon';
import { PLATFORM_CONFIG, Platform } from '@/types/post';
import { openAssistedPlatform } from '@/lib/assistedPublish';
import { useConfirmAssistedPublish } from '@/hooks/usePosts';
import { CheckCircle2, ExternalLink, SkipForward } from 'lucide-react';

type PlatformState = 'pending' | 'opened' | 'confirmed' | 'skipped';

interface AssistedPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  caption: string;
  hashtags: string[];
  platforms: Platform[];
}

export function AssistedPublishDialog({
  open,
  onOpenChange,
  postId,
  caption,
  hashtags,
  platforms,
}: AssistedPublishDialogProps) {
  const [states, setStates] = useState<Record<string, PlatformState>>(() =>
    Object.fromEntries(platforms.map((p) => [p, 'pending']))
  );
  const confirmMutation = useConfirmAssistedPublish();

  const allDone = platforms.every(
    (p) => states[p] === 'confirmed' || states[p] === 'skipped'
  );

  const handleOpen = async (platform: Platform) => {
    await openAssistedPlatform(platform, caption, hashtags);
    setStates((prev) => ({ ...prev, [platform]: 'opened' }));
  };

  const handleConfirm = async (platform: Platform) => {
    await confirmMutation.mutateAsync({ postId, platform, confirmed: true });
    setStates((prev) => ({ ...prev, [platform]: 'confirmed' }));
  };

  const handleSkip = async (platform: Platform) => {
    await confirmMutation.mutateAsync({ postId, platform, confirmed: false });
    setStates((prev) => ({ ...prev, [platform]: 'skipped' }));
  };

  const completedCount = platforms.filter(
    (p) => states[p] === 'confirmed' || states[p] === 'skipped'
  ).length;

  return (
    <Dialog open={open} onOpenChange={allDone ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => { if (!allDone) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Publish Manually</DialogTitle>
          <DialogDescription>
            Open each platform and confirm once you've published.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(completedCount / platforms.length) * 100}%` }}
            />
          </div>
          <span>
            {completedCount}/{platforms.length}
          </span>
        </div>

        {/* Platform list */}
        <div className="space-y-3">
          {platforms.map((platform) => {
            const Icon = PlatformIcons[platform];
            const config = PLATFORM_CONFIG[platform];
            const state = states[platform];

            return (
              <div
                key={platform}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{config.label}</span>

                {state === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleOpen(platform)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </Button>
                )}

                {state === 'opened' && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleConfirm(platform)}
                      disabled={confirmMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Published
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      onClick={() => handleSkip(platform)}
                      disabled={confirmMutation.isPending}
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Skip
                    </Button>
                  </div>
                )}

                {state === 'confirmed' && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </span>
                )}

                {state === 'skipped' && (
                  <span className="text-sm text-muted-foreground">Skipped</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Done button */}
        <Button
          className="w-full"
          disabled={!allDone}
          onClick={() => onOpenChange(false)}
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
