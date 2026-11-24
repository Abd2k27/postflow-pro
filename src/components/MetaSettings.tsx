import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Facebook, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MetaSettingsProps {
  platform: 'facebook' | 'instagram';
  onChange: (settings: MetaMetadata) => void;
}

export interface MetaMetadata {
  /** Facebook Page to publish to */
  page_id?: string;
  /** Instagram professional account to publish to */
  ig_account_id?: string;
}

interface MetaPage {
  id: string;
  name: string;
  picture?: string;
  instagram?: { id: string; username?: string };
}

function useMetaPages(platform: 'facebook' | 'instagram') {
  return useQuery({
    queryKey: ['meta-pages', platform],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-meta-pages', { body: { platform } });
      if (error) throw error;
      return (data?.pages ?? []) as MetaPage[];
    },
    staleTime: 1000 * 60,
  });
}

export function MetaSettings({ platform, onChange }: MetaSettingsProps) {
  const { data: pages, isLoading, error } = useMetaPages(platform);
  const isFacebook = platform === 'facebook';

  // Facebook: any granted Page. Instagram: Pages that have a linked professional account.
  const options = (pages ?? [])
    .filter((p) => isFacebook || p.instagram)
    .map((p) => ({
      value: isFacebook ? p.id : p.instagram!.id,
      label: isFacebook ? p.name : `@${p.instagram!.username ?? p.instagram!.id} (${p.name})`,
    }));

  const [selected, setSelected] = useState<string | undefined>(undefined);

  // Pre-select when there is exactly one destination
  useEffect(() => {
    if (!selected && options.length === 1) setSelected(options[0].value);
  }, [options, selected]);

  useEffect(() => {
    onChange(isFacebook ? { page_id: selected } : { ig_account_id: selected });
  }, [selected, isFacebook, onChange]);

  const Icon = isFacebook ? Facebook : Instagram;
  const color = isFacebook ? 'text-blue-600' : 'text-pink-600';
  const borderColor = isFacebook ? 'border-blue-500/20' : 'border-pink-500/20';
  const bgColor = isFacebook ? 'bg-blue-500/5' : 'bg-pink-500/5';

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span>{isFacebook ? 'Facebook Settings' : 'Instagram Settings'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-10 w-full" />}

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Could not load your {isFacebook ? 'Facebook Pages' : 'Instagram accounts'}. Please reconnect your account.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && options.length === 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {isFacebook
                ? 'No Facebook Page found. Reconnect Facebook and select at least one Page.'
                : 'No Instagram professional account found. Link an Instagram Business or Creator account to one of your Facebook Pages, then reconnect.'}
            </AlertDescription>
          </Alert>
        )}

        {options.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {isFacebook ? 'Publish to Page' : 'Publish to Instagram account'}
            </Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className={!selected ? 'border-destructive' : ''}>
                <SelectValue placeholder={isFacebook ? 'Select a Page' : 'Select an account'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {isFacebook
                ? 'Posts are published publicly on the selected Page, with your image or video attached.'
                : 'Images must be JPEG. Videos are published as Reels.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
