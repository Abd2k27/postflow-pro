import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { PLATFORM_CONFIG } from '@/types/post';
import { usePost } from '@/hooks/usePost';
import { useConfirmAssistedPublish } from '@/hooks/usePosts';
import { openAssistedPlatform } from '@/lib/assistedPublish';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, ExternalLink, CheckCircle2, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePost(id);
  const confirmMutation = useConfirmAssistedPublish();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !post) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Post not found</p>
          <Button variant="ghost" onClick={() => navigate('/history')} className="mt-4">
            Back to History
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleRetry = async (platform: string) => {
    const pp = post.platformPosts.find((p) => p.platform === platform);
    if (!pp) return;
    toast.info(`Retrying ${PLATFORM_CONFIG[pp.platform].label}...`);
    await supabase.functions.invoke('retry-platform', {
      body: { post_id: post.id, platform },
    });
  };

  const handleConfirm = async (platform: string) => {
    await confirmMutation.mutateAsync({
      postId: post.id,
      platform: platform as any,
      confirmed: true,
    });
    toast.success(`Marked ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].label} as published`);
  };

  const handleSkip = async (platform: string) => {
    await confirmMutation.mutateAsync({
      postId: post.id,
      platform: platform as any,
      confirmed: false,
    });
    toast.info(`Skipped ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].label}`);
  };

  const handleReopen = async (platform: string) => {
    await openAssistedPlatform(
      platform as any,
      post.caption,
      post.hashtags
    );
  };

  const getPlatformUrl = (platform: string, platformPostId: string): string | null => {
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/i/status/${platformPostId}`;
      case 'facebook':
        return `https://www.facebook.com/${platformPostId}`;
      case 'instagram':
        return `https://www.instagram.com/p/${platformPostId}`;
      case 'youtube':
        return `https://www.youtube.com/watch?v=${platformPostId}`;
      case 'tiktok':
        return `https://www.tiktok.com/@/video/${platformPostId}`;
      case 'linkedin':
        return `https://www.linkedin.com/feed/update/${platformPostId}`;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Post Detail</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Caption */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Caption</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{post.caption}</p>
            {post.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.hashtags.map((h) => (
                  <span key={h} className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    {h}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Platform Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {post.platformPosts.map((pp) => {
              const Icon = PlatformIcons[pp.platform];
              const config = PLATFORM_CONFIG[pp.platform];
              const isAwaiting = pp.status === 'awaiting_confirmation';

              return (
                <div
                  key={pp.platform}
                  className={`flex items-center justify-between rounded-lg border p-3 ${isAwaiting ? 'border-blue-300 bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      {pp.platformPostId && (
                        <p className="font-mono text-xs text-muted-foreground">
                          ID: {pp.platformPostId}
                        </p>
                      )}
                      {pp.errorMessage && (
                        <p className="text-xs text-destructive">{pp.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={pp.status} />

                    {isAwaiting && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleReopen(pp.platform)}
                          title="Reopen platform"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleConfirm(pp.platform)}
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Published
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleSkip(pp.platform)}
                          disabled={confirmMutation.isPending}
                        >
                          <SkipForward className="h-3 w-3" /> Skip
                        </Button>
                      </>
                    )}

                    {pp.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRetry(pp.platform)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {pp.status === 'published' && pp.platformPostId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const url = getPlatformUrl(pp.platform, pp.platformPostId!);
                          if (url) window.open(url, '_blank', 'noopener');
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
