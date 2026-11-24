import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionModeSelector } from '@/components/ConnectionModeSelector';
import { PLATFORM_CONFIG, Platform } from '@/types/post';
import { useAccounts } from '@/hooks/useAccounts';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOAuthErrorToast } from '@/hooks/useOAuthErrorToast';

const ALL_PLATFORMS: Platform[] = ['twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'];

export default function ConnectedAccounts() {
  useOAuthErrorToast();
  const { data: accounts, isLoading } = useAccounts();
  const queryClient = useQueryClient();

  const handleConnect = async (platform: Platform) => {
    try {
      const { data, error } = await supabase.functions.invoke(`connect-${platform}`);
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error(`Failed to connect ${PLATFORM_CONFIG[platform].label}`);
    }
  };

  const handleDisconnect = async (accountId: string, platform: Platform) => {
    try {
      const { error } = await supabase.functions.invoke('disconnect-account', {
        body: { account_id: accountId },
      });
      if (error) throw error;
      toast.success(`Disconnected ${PLATFORM_CONFIG[platform].label}`);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    } catch {
      toast.error(`Failed to disconnect ${PLATFORM_CONFIG[platform].label}`);
    }
  };

  const getAccount = (platform: Platform) =>
    accounts?.find((a) => a.platform === platform);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Connected Accounts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your social media connections
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52 w-full" />)
            : ALL_PLATFORMS.map((platform) => (
                <ConnectionModeSelector
                  key={platform}
                  platform={platform}
                  account={getAccount(platform)}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
        </div>

        {/* Meta Reviewer Information Section */}
        <Alert className="mt-8 border-blue-200 bg-blue-50/50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Meta Reviewer Information</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs space-y-2 mt-2">
            <p>
              This application uses <strong>Facebook Login for Business</strong> to allow users to connect their Facebook Pages and Instagram Business accounts.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>pages_manage_posts:</strong> Used to publish content to the selected Facebook Page feed.</li>
              <li><strong>instagram_content_publish:</strong> Used to publish Reels and Media to Instagram Business accounts.</li>
              <li><strong>pages_show_list & instagram_basic:</strong> Used to identify and list the available Pages/Accounts for the user.</li>
            </ul>
            <p className="pt-2 italic">
              All connections are performed via secure OAuth 2.0 flow. PostFlow Pro does not store user passwords.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
