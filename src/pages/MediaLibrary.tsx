import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMediaAssets, useUploadMedia, useDeleteMedia } from '@/hooks/useMediaAssets';
import { Upload, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function MediaLibrary() {
  const { data: assets, isLoading } = useMediaAssets();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    try {
      await uploadMedia.mutateAsync(file);
      toast.success('Media uploaded');
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id: string, storagePath: string) => {
    try {
      await deleteMedia.mutateAsync({ id, storagePath });
      toast.success('Media deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-muted-foreground">Your uploaded images and videos</p>
        </div>

        {/* Upload area */}
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Drop files here or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">Images or Videos (max 100MB)</p>
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

        {/* Media grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  {asset.type === 'image' ? (
                    <img
                      src={asset.thumbnailUrl ?? asset.url}
                      alt={asset.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted">
                      <Video className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex w-full items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-white">{asset.name}</p>
                        <p className="text-xs text-white/70">
                          {(asset.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:text-destructive"
                        onClick={() => handleDelete(asset.id, asset.storagePath ?? '')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20 text-center">
            <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No media uploaded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload media or create posts with attachments
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
