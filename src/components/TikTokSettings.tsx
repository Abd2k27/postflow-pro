import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTikTokCreatorInfo } from '@/hooks/useTikTokSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface TikTokSettingsProps {
  onChange: (settings: TikTokMetadata) => void;
}

export interface TikTokMetadata {
  privacy_level?: string;
  allow_comments: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  content_disclosure_info?: {
    brand_organic: boolean;
    brand_content: boolean;
  };
}

export function TikTokSettings({ onChange }: TikTokSettingsProps) {
  const { data: creatorInfo, isLoading, error } = useTikTokCreatorInfo();
  
  const [privacy, setPrivacy] = useState<string | undefined>(undefined);
  const [allowComments, setAllowComments] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [isBranded, setIsBranded] = useState(false);
  const [brandOrganic, setBrandOrganic] = useState(false);
  const [brandContent, setBrandContent] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);

  useEffect(() => {
    onChange({
      privacy_level: privacy,
      allow_comments: allowComments,
      allow_duet: allowDuet,
      allow_stitch: allowStitch,
      content_disclosure_info: isBranded ? {
        brand_organic: brandOrganic,
        brand_content: brandContent,
      } : undefined,
    });
  }, [privacy, allowComments, allowDuet, allowStitch, isBranded, brandOrganic, brandContent, onChange]);

  const handleBrandedChange = (checked: boolean) => {
    setIsBranded(checked);
    if (checked && privacy === 'SELF_ONLY') {
      setPrivacy('PUBLIC_TO_EVERYONE');
      setPrivacyWarning('Branded content must be public. Privacy has been changed to "Everyone".');
    } else {
      setPrivacyWarning(null);
    }
  };

  const handlePrivacyChange = (value: string) => {
    if (isBranded && value === 'SELF_ONLY') {
      setPrivacy('PUBLIC_TO_EVERYONE');
      setPrivacyWarning('Branded content cannot be private ("Only me").');
    } else {
      setPrivacy(value);
      setPrivacyWarning(null);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load TikTok creator info. Please make sure your account is connected correctly.
        </AlertDescription>
      </Alert>
    );
  }

  const isLimitReached = creatorInfo?.daily_user_posting_limit?.remaining_posts === 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>TikTok Post Settings</span>
          {creatorInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">Posting as:</span>
              <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-primary/10">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={creatorInfo.creator_avatar_url} />
                  <AvatarFallback className="text-[10px]">{creatorInfo.creator_nickname[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-primary">{creatorInfo.creator_nickname}</span>
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLimitReached && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Daily posting limit reached ({creatorInfo?.daily_user_posting_limit?.max_posts} max). You cannot post until tomorrow.
            </AlertDescription>
          </Alert>
        )}
        {!isLimitReached && creatorInfo?.daily_user_posting_limit && (
           <p className="text-[10px] text-muted-foreground text-right -mt-2">
             Remaining posts today: <span className="font-semibold text-primary">{creatorInfo.daily_user_posting_limit.remaining_posts}</span>
           </p>
        )}

        {/* Privacy Level */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Privacy Status (Mandatory)</Label>
          <Select onValueChange={handlePrivacyChange} value={privacy}>
            <SelectTrigger className={!privacy ? "border-destructive" : ""}>
              <SelectValue placeholder="Select who can see this post" />
            </SelectTrigger>
            <SelectContent>
              {creatorInfo?.privacy_level_options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!privacy && (
            <p className="text-[10px] text-destructive">Please manually select a privacy level.</p>
          )}
          {privacyWarning && (
            <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {privacyWarning}
            </p>
          )}
        </div>

        {/* Interactions */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs">Allow Comments</Label>
              <p className="text-[10px] text-muted-foreground">Users can comment on your video</p>
            </div>
            <Switch
              checked={allowComments}
              onCheckedChange={setAllowComments}
              disabled={creatorInfo?.comment_disabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs">Allow Duet</Label>
              <p className="text-[10px] text-muted-foreground">Users can duet with your video</p>
            </div>
            <Switch
              checked={allowDuet}
              onCheckedChange={setAllowDuet}
              disabled={creatorInfo?.duet_disabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs">Allow Stitch</Label>
              <p className="text-[10px] text-muted-foreground">Users can stitch with your video</p>
            </div>
            <Switch
              checked={allowStitch}
              onCheckedChange={setAllowStitch}
              disabled={creatorInfo?.stitch_disabled}
            />
          </div>
        </div>

        {/* Content Disclosure */}
        <div className="space-y-3 pt-2 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs">Content Disclosure</Label>
              <p className="text-[10px] text-muted-foreground">Disclose if this is branded content</p>
            </div>
            <Switch
              checked={isBranded}
              onCheckedChange={handleBrandedChange}
            />
          </div>

          {isBranded && (
            <div className="space-y-3 bg-background/30 p-3 rounded-lg border border-primary/5">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="brand_organic" 
                  checked={brandOrganic} 
                  onCheckedChange={(checked) => setBrandOrganic(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="brand_organic"
                    className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Your brand (Organic)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    You are promoting your own brand or service.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="brand_content" 
                  checked={brandContent} 
                  onCheckedChange={(checked) => setBrandContent(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="brand_content"
                    className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Branded content
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    You are promoting a third-party brand or service.
                  </p>
                </div>
              </div>
              {!brandOrganic && !brandContent && (
                <p className="text-[10px] text-destructive font-medium">Please select at least one option.</p>
              )}
            </div>
          )}
        </div>

        {/* Consent Declaration */}
        <div className="bg-muted/50 p-2 rounded text-[10px] text-muted-foreground flex gap-2">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          <p>
            By posting, you agree to TikTok's{' '}
            <a 
              href="https://www.tiktok.com/legal/page/global/bc-policy/en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Branded Content Policy <ExternalLink className="h-2 w-2" />
            </a>
            {' '}and{' '}
            <a 
              href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Music Usage Confirmation <ExternalLink className="h-2 w-2" />
            </a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

