import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Instagram } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

interface MetaSettingsProps {
  platform: 'facebook' | 'instagram';
  onChange: (settings: MetaMetadata) => void;
}

export interface MetaMetadata {
  privacy?: string;
}

export function MetaSettings({ platform, onChange }: MetaSettingsProps) {
  const { data: accounts } = useAccounts();
  const account = accounts?.find(a => a.platform === platform);

  const [privacy, setPrivacy] = useState(platform === 'facebook' ? 'EVERYONE' : 'PUBLIC');

  useEffect(() => {
    onChange({ privacy });
  }, [privacy, onChange]);

  const Icon = platform === 'facebook' ? Facebook : Instagram;
  const color = platform === 'facebook' ? 'text-blue-600' : 'text-pink-600';
  const borderColor = platform === 'facebook' ? 'border-blue-500/20' : 'border-pink-500/20';
  const bgColor = platform === 'facebook' ? 'bg-blue-500/5' : 'bg-pink-500/5';

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="capitalize">{platform} Settings</span>
          </div>
          {account?.username && (
            <span className="text-xs font-normal text-muted-foreground">
              Page: <span className={`font-semibold ${color}`}>{account.username}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platform === 'facebook' && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Privacy / Audience</Label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EVERYONE">Public</SelectItem>
                <SelectItem value="ALL_FRIENDS">Friends</SelectItem>
                <SelectItem value="SELF">Only Me</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Controls the privacy level of your post on Facebook via the Graph API.
            </p>
          </div>
        )}
        
        {platform === 'instagram' && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground italic">
              Instagram posts are public by default for professional accounts.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Utilizes Instagram Content Publishing API for Reels and Media posts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
