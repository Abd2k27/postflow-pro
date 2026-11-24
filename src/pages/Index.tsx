import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { PLATFORM_CONFIG } from '@/types/post';
import { usePosts } from '@/hooks/usePosts';
import { useStats } from '@/hooks/useStats';
import { useAccounts } from '@/hooks/useAccounts';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const statCards = [
    { label: 'Total Posts', value: stats?.totalPosts ?? 0, icon: Layers, color: 'text-primary' },
    { label: 'Successful', value: stats?.successfulPosts ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Failed', value: stats?.failedPosts ?? 0, icon: XCircle, color: 'text-destructive' },
    { label: 'Scheduled', value: stats?.scheduledPosts ?? 0, icon: Clock, color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your publishing activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg bg-muted p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-7 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connected Platforms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Connected Platforms</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')} className="gap-1 text-xs text-muted-foreground">
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-32" />)}
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {accounts.map((account) => {
                  const Icon = PlatformIcons[account.platform];
                  const config = PLATFORM_CONFIG[account.platform];
                  return (
                    <div
                      key={account.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        account.connected
                          ? 'border-success/30 bg-success/5'
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                      {account.connected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No accounts connected yet. <Button variant="link" className="h-auto p-0" onClick={() => navigate('/accounts')}>Connect one</Button></p>
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Posts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="gap-1 text-xs text-muted-foreground">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {postsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 4).map((post) => (
                <div
                  key={post.id}
                  className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{post.caption}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No posts yet. Create your first post!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
