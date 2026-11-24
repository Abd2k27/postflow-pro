import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { AssistedPublishDialog } from '@/components/AssistedPublishDialog';
import { TikTokSettings, TikTokMetadata } from '@/components/TikTokSettings';
import { useTikTokCreatorInfo } from '@/hooks/useTikTokSettings';
import { YouTubeSettings, YouTubeMetadata } from '@/components/YouTubeSettings';
import { MetaSettings, MetaMetadata } from '@/components/MetaSettings';
import { TwitterSettings, TwitterMetadata } from '@/components/TwitterSettings';
import { PLATFORM_CONFIG, Platform } from '@/types/post';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreatePost } from '@/hooks/usePosts';
import { useUploadMedia } from '@/hooks/useMediaAssets';
import {
  Upload,
  Image as ImageIcon,
  Video,
  CalendarIcon,
  Send,
  Clock,
  X,
  Hash,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Compose() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [platformMetadata, setPlatformMetadata] = useState<Record<string, any>>({});

  // Assisted publish dialog state
  const [assistedDialog, setAssistedDialog] = useState<{
    open: boolean;
    postId: string;
    platforms: Platform[];
  }>({ open: false, postId: '', platforms: [] });

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: tiktokCreatorInfo } = useTikTokCreatorInfo();
  const createPost = useCreatePost();
  const uploadMedia = useUploadMedia();

  const connectedPlatforms = accounts?.filter((a) => a.connected) ?? [];

  const hasAssistedSelected = selectedPlatforms.some((p) => {
    const account = accounts?.find((a) => a.platform === p);
    return account?.connectionMode === 'assisted';
  });

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        // We'll store this for validation during publish
        (file as any).duration = duration;
      };
      video.src = URL.createObjectURL(file);
    }

    setMediaType(isImage ? 'image' : 'video');
    setMediaPreview(URL.createObjectURL(file));
    setMediaFile(file);
  };

  const isPublishing = createPost.isPending || uploadMedia.isPending;

  const isTikTokInvalid = selectedPlatforms.includes('tiktok') && (
    tiktokCreatorInfo?.daily_user_posting_limit?.remaining_posts === 0 ||
    (platformMetadata['tiktok'] as TikTokMetadata)?.content_disclosure_info &&
    !(platformMetadata['tiktok'] as TikTokMetadata).content_disclosure_info?.brand_organic &&
    !(platformMetadata['tiktok'] as TikTokMetadata).content_disclosure_info?.brand_content
  );

  const isAutoPlatform = (p: Platform) =>
    selectedPlatforms.includes(p) &&
    accounts?.find((a) => a.platform === p)?.connectionMode !== 'assisted';

  const handlePublish = async () => {
    if (!caption.trim()) {
      toast.error('Please write a caption');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    // Validation for TikTok
    if (selectedPlatforms.includes('tiktok')) {
      const tiktokMeta = platformMetadata['tiktok'] as TikTokMetadata;
      
      if (tiktokCreatorInfo?.daily_user_posting_limit?.remaining_posts === 0) {
        toast.error('TikTok daily posting limit reached. Please try again tomorrow.');
        return;
      }

      if (!tiktokMeta?.privacy_level) {
        toast.error('Please select a privacy level for TikTok');
        return;
      }

      if (tiktokMeta?.content_disclosure_info) {
        const { brand_organic, brand_content } = tiktokMeta.content_disclosure_info;
        if (!brand_organic && !brand_content) {
          toast.error('Please select at least one branded content option for TikTok');
          return;
        }
      }

      if (mediaType !== 'video' || !mediaFile) {
        toast.error('TikTok requires a video');
        return;
      }

      const duration = (mediaFile as any).duration;
      const maxDuration = tiktokCreatorInfo?.max_video_post_duration_sec || 600;
      if (duration > maxDuration) {
        toast.error(`TikTok videos cannot exceed ${Math.floor(maxDuration / 60)} minutes`);
        return;
      }
    }

    // Validation for Facebook / Instagram destinations (API mode only)
    if (isAutoPlatform('facebook') && !(platformMetadata['facebook'] as MetaMetadata)?.page_id) {
      toast.error('Please select the Facebook Page to publish to');
      return;
    }
    if (isAutoPlatform('instagram')) {
      if (!(platformMetadata['instagram'] as MetaMetadata)?.ig_account_id) {
        toast.error('Please select the Instagram account to publish to');
        return;
      }
      if (!mediaFile) {
        toast.error('Instagram requires an image or a video');
        return;
      }
      if (mediaType === 'image' && mediaFile.type !== 'image/jpeg') {
        toast.error('Instagram only supports JPEG images. Please upload a .jpg file.');
        return;
      }
    }

    try {
      let mediaId: string | undefined;
      if (mediaFile) {
        const asset = await uploadMedia.mutateAsync(mediaFile);
        mediaId = asset.id;
      }

      const hashtagList = hashtags
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
        .map((h) => (h.startsWith('#') ? h : `#${h}`));

      // Partition platforms into assisted and auto
      const assistedPlatforms: Platform[] = [];
      const autoPlatforms: Platform[] = [];

      for (const p of selectedPlatforms) {
        const account = accounts?.find((a) => a.platform === p);
        if (account?.connectionMode === 'assisted') {
          assistedPlatforms.push(p);
        } else {
          autoPlatforms.push(p);
        }
      }

      const result = await createPost.mutateAsync({
        caption,
        hashtags: hashtagList,
        platforms: autoPlatforms,
        assistedPlatforms,
        scheduledAt: scheduleMode === 'later' && scheduleDate ? scheduleDate.toISOString() : undefined,
        mediaId,
        platformMetadata,
      });

      if (autoPlatforms.length > 0) {
        toast.success(
          scheduleMode === 'later'
            ? `Post scheduled for ${scheduleDate ? format(scheduleDate, 'PPP') : 'later'}`
            : `Publishing to ${autoPlatforms.length} platform(s)...`
        );
        if (autoPlatforms.includes('tiktok') && scheduleMode !== 'later') {
          toast.info(
            'Your video was sent to TikTok. It may take a few minutes for the content to process and be visible on your profile.',
            { duration: 8000 }
          );
        }
      }

      // Open assisted dialog if there are assisted platforms
      if (assistedPlatforms.length > 0) {
        setAssistedDialog({
          open: true,
          postId: result.post.id,
          platforms: assistedPlatforms,
        });
      } else {
        navigate('/history');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create post');
    }
  };

  const handleAssistedDialogClose = () => {
    setAssistedDialog({ open: false, postId: '', platforms: [] });
    navigate('/history');
  };

  const handleTikTokMetadataChange = useCallback((metadata: TikTokMetadata) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      tiktok: metadata,
    }));
  }, []);

  const handleYouTubeMetadataChange = useCallback((metadata: YouTubeMetadata) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      youtube: metadata,
    }));
  }, []);

  const handleMetaMetadataChange = useCallback((platform: 'facebook' | 'instagram', metadata: MetaMetadata) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      [platform]: metadata,
    }));
  }, []);

  const handleTwitterMetadataChange = useCallback((metadata: TwitterMetadata) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      twitter: metadata,
    }));
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <p className="mt-1 text-muted-foreground">
            Compose and publish across platforms
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main editor */}
          <div className="space-y-6 lg:col-span-3">
            {/* Media Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" /> Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mediaPreview ? (
                  <div className="relative overflow-hidden rounded-lg border">
                    {mediaType === 'image' ? (
                      <img src={mediaPreview} alt="Preview" className="h-56 w-full object-cover" />
                    ) : (
                      <video src={mediaPreview} className="h-56 w-full object-cover" controls />
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7"
                      onClick={() => { setMediaPreview(null); setMediaType(null); setMediaFile(null); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                      dragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex gap-2 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <Video className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop files here or click to upload</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Images (JPG, PNG, WebP) or Videos (MP4, MOV)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFile(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Caption */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Caption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write your caption here... ✨"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add hashtags (comma-separated)"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {caption.length} characters
                </p>
              </CardContent>
            </Card>

            {/* Platform Specific Settings */}
            <div className="space-y-4">
              {selectedPlatforms.includes('tiktok') && mediaType === 'video' && (
                <TikTokSettings onChange={handleTikTokMetadataChange} />
              )}
              {selectedPlatforms.includes('youtube') && mediaType === 'video' && (
                <YouTubeSettings defaultTitle={caption} onChange={handleYouTubeMetadataChange} />
              )}
              {isAutoPlatform('facebook') && (
                <MetaSettings platform="facebook" onChange={(meta) => handleMetaMetadataChange('facebook', meta)} />
              )}
              {isAutoPlatform('instagram') && (
                <MetaSettings platform="instagram" onChange={(meta) => handleMetaMetadataChange('instagram', meta)} />
              )}
              {selectedPlatforms.includes('twitter') && (
                <TwitterSettings onChange={handleTwitterMetadataChange} />
              )}
              
              {selectedPlatforms.includes('tiktok') && mediaType === 'image' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>TikTok Limit</AlertTitle>
                  <AlertDescription>
                    TikTok posting currently only supports videos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Sidebar controls */}
          <div className="space-y-6 lg:col-span-2">
            {/* Platform Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {accountsLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
                ) : connectedPlatforms.length > 0 ? (
                  connectedPlatforms.map((account) => {
                    const Icon = PlatformIcons[account.platform];
                    const config = PLATFORM_CONFIG[account.platform];
                    const isSelected = selectedPlatforms.includes(account.platform);
                    const isAssisted = account.connectionMode === 'assisted';
                    return (
                      <label
                        key={account.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                          isSelected ? 'border-primary bg-accent' : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePlatform(account.platform)}
                        />
                        <Icon className="h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium">{config.label}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0',
                                isAssisted
                                  ? 'border-blue-300 text-blue-600'
                                  : 'border-green-300 text-green-600'
                              )}
                            >
                              {isAssisted ? 'Assisted' : 'Auto'}
                            </Badge>
                          </div>
                          {account.username && (
                            <p className="truncate text-xs text-muted-foreground">
                              {account.username}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No accounts connected yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={scheduleMode === 'now' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScheduleMode('now')}
                    className="flex-1 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Now
                  </Button>
                  <Button
                    variant={scheduleMode === 'later' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (hasAssistedSelected) return;
                      setScheduleMode('later');
                    }}
                    className="flex-1 gap-1.5"
                    disabled={hasAssistedSelected}
                    title={
                      hasAssistedSelected
                        ? 'Scheduling is not available for assisted platforms'
                        : undefined
                    }
                  >
                    <Clock className="h-3.5 w-3.5" /> Later
                  </Button>
                </div>

                {hasAssistedSelected && scheduleMode === 'now' && (
                  <p className="text-xs text-muted-foreground">
                    Scheduling is not available when assisted platforms are selected.
                  </p>
                )}

                {scheduleMode === 'later' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !scheduleDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto p-3"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </CardContent>
            </Card>

            {/* Publish */}
            <Button 
              onClick={handlePublish} 
              className="w-full gap-2" 
              size="lg" 
              disabled={isPublishing || isTikTokInvalid}
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scheduleMode === 'later' ? (
                <>
                  <Clock className="h-4 w-4" /> Schedule Post
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Publish Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Assisted Publish Dialog */}
      <AssistedPublishDialog
        open={assistedDialog.open}
        onOpenChange={(open) => {
          if (!open) handleAssistedDialogClose();
        }}
        postId={assistedDialog.postId}
        caption={caption}
        hashtags={hashtags
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)
          .map((h) => (h.startsWith('#') ? h : `#${h}`))}
        platforms={assistedDialog.platforms}
      />
    </DashboardLayout>
  );
}
