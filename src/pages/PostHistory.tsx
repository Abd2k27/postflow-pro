import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from '@/components/CalendarView';
import { usePosts, useDeletePost } from '@/hooks/usePosts';
import { Eye, RotateCcw, Trash2, UserCheck, LayoutList, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function PostHistory() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = usePosts();
  const deletePost = useDeletePost();

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleRetry = async (postId: string) => {
    toast.info('Retrying failed platforms...');
    await supabase.functions.invoke('publish-post', { body: { post_id: postId } });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Post History</h1>
            <p className="mt-1 text-muted-foreground">All your published and scheduled posts</p>
          </div>
          <Button onClick={() => navigate('/compose')}>Create Post</Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="h-4 w-4" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendrier
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0 space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : posts && posts.length > 0 ? (
              posts.map((post) => {
                const hasAwaiting = post.platformPosts.some(
                  (pp) => pp.status === 'awaiting_confirmation'
                );

                return (
                  <Card
                    key={post.id}
                    className={`transition-colors hover:bg-muted/30 ${hasAwaiting ? 'border-blue-300' : ''}`}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      {post.media ? (
                        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden border bg-muted">
                          <img 
                            src={post.media.thumbnailUrl || post.media.url} 
                            alt={post.media.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                          <LayoutList className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{post.caption}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {post.hashtags.map((h) => (
                            <span key={h} className="rounded bg-muted px-1.5 py-0.5">{h}</span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {post.platformPosts.map((pp) => {
                            const Icon = PlatformIcons[pp.platform];
                            return (
                              <div key={pp.platform} className="flex items-center gap-1">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <StatusBadge status={pp.status} />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          {post.scheduledAt 
                            ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`
                            : `Created: ${new Date(post.createdAt).toLocaleDateString()}`
                          }
                        </p>
                        <div className="flex gap-1">
                          {hasAwaiting && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600"
                              onClick={() => navigate(`/post/${post.id}`)}
                              title="Confirm publication"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/post/${post.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {post.platformPosts.some((pp) => pp.status === 'failed') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetry(post.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(post.id)}
                            disabled={deletePost.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20 text-center">
                <p className="text-muted-foreground">No posts yet</p>
                <Button variant="link" onClick={() => navigate('/compose')}>Create your first post</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[600px] w-full rounded-xl" />
            ) : (
              <CalendarView posts={posts ?? []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
