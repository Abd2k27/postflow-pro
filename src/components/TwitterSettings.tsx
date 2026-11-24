import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

interface TwitterSettingsProps {
  onChange: (settings: TwitterMetadata) => void;
}

export interface TwitterMetadata {
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following';
}

export function TwitterSettings({ onChange }: TwitterSettingsProps) {
  const { data: accounts } = useAccounts();
  const account = accounts?.find(a => a.platform === 'twitter');

  const [replySettings, setReplySettings] = useState<'everyone' | 'mentionedUsers' | 'following'>('everyone');

  useEffect(() => {
    onChange({ reply_settings: replySettings });
  }, [replySettings, onChange]);

  return (
    <Card className="border-slate-800/20 bg-slate-800/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
            </svg>
            <span>X (Twitter) Settings</span>
          </div>
          {account?.username && (
            <span className="text-xs font-normal text-muted-foreground">
              Account: <span className="font-semibold text-primary">{account.username}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Who can reply?
          </Label>
          <Select value={replySettings} onValueChange={(v: any) => setReplySettings(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="following">People you follow</SelectItem>
              <SelectItem value="mentionedUsers">Only people you mention</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            This setting limits who can interact with your post on X.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
