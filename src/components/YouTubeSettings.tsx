import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Youtube } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

interface YouTubeSettingsProps {
  defaultTitle: string;
  onChange: (settings: YouTubeMetadata) => void;
}

export interface YouTubeMetadata {
  title: string;
  privacy: 'public' | 'private' | 'unlisted';
  madeForKids: boolean;
}

export function YouTubeSettings({ defaultTitle, onChange }: YouTubeSettingsProps) {
  const { data: accounts } = useAccounts();
  const ytAccount = accounts?.find(a => a.platform === 'youtube');

  const [title, setTitle] = useState(defaultTitle.substring(0, 100));
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');
  const [madeForKids, setMadeForKids] = useState(false);

  useEffect(() => {
    onChange({ title, privacy, madeForKids });
  }, [title, privacy, madeForKids, onChange]);

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-600" />
            <span>YouTube Video Settings</span>
          </div>
          {ytAccount?.username && (
            <span className="text-xs font-normal text-muted-foreground">
              Channel: <span className="font-semibold text-red-600">{ytAccount.username}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Video Title (Required)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            maxLength={100}
          />
          <p className="text-[10px] text-muted-foreground text-right">{title.length}/100</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Visibility</Label>
            <Select value={privacy} onValueChange={(v: any) => setPrivacy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="space-y-0.5">
              <Label className="text-xs">Made for Kids?</Label>
              <p className="text-[10px] text-muted-foreground">Required by YouTube</p>
            </div>
            <Switch checked={madeForKids} onCheckedChange={setMadeForKids} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
