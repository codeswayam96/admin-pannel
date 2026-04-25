"use client";

import { useState, useEffect } from "react";
import { Upload, Copy, Trash2, Search, Grid, List, Link2, Loader2, RefreshCw, HardDrive, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchMedia, createMedia, deleteMedia } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";

interface MediaItem {
  id: number;
  name: string;
  url: string;
  size: string | null;
  mimeType: string | null;
  provider: string | null;
  createdAt: string;
}

const emptyForm = { name: "", url: "", size: "", mimeType: "image/jpeg", provider: "url" };

const providerInfo: Record<string, { label: string; icon: any; status: "active" | "coming-soon" }> = {
  url: { label: "URL / Link", icon: Link2, status: "active" },
  s3: { label: "Amazon S3", icon: Cloud, status: "coming-soon" },
  r2: { label: "Cloudflare R2", icon: Cloud, status: "coming-soon" },
};

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadDialog, setUploadDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchMedia()
      .then(setMedia)
      .catch((err) => setError(err.message || "Failed to load media"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = media.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.url.toLowerCase().includes(search.toLowerCase()));

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleUpload = async () => {
    if (!form.url.trim()) { toast.error("URL is required"); return; }
    if (!form.name.trim()) {
      const parts = form.url.split("/");
      setForm(p => ({ ...p, name: parts[parts.length - 1] || "media-file" }));
    }
    setSaving(true);
    try {
      const created = await createMedia({
        name: form.name || form.url.split("/").pop() || "media-file",
        url: form.url,
        size: form.size,
        mimeType: form.mimeType,
        provider: form.provider,
      });
      setMedia(prev => [created, ...prev]);
      toast.success("Media added!");
      setUploadDialog(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.message || "Failed to add media");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMedia(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      toast.success("File deleted");
    } catch { toast.error("Failed to delete media"); }
  };

  const getMimeLabel = (mimeType: string | null) => {
    if (!mimeType) return "FILE";
    return mimeType.split("/")[1]?.toUpperCase() || "FILE";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">{media.length} files · Manage images and assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={14} />
          </Button>
          <Button onClick={() => setUploadDialog(true)}>
            <Upload size={16} /> Add Media
          </Button>
        </div>
      </div>

      {/* Storage providers status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(providerInfo).map(([key, info]) => (
          <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border ${info.status === "active" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border bg-muted/30"}`}>
            <div className={`p-2 rounded-md ${info.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-muted"}`}>
              <info.icon size={15} className={info.status === "active" ? "text-emerald-600" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{info.label}</p>
              <p className="text-xs text-muted-foreground">{info.status === "active" ? "Active" : "Coming soon"}</p>
            </div>
            {info.status === "active" && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}>
            <Grid size={15} />
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("list")}>
            <List size={15} />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
          <HardDrive size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{media.length === 0 ? "No media files yet" : "No files match your search"}</p>
          {media.length === 0 && (
            <>
              <p className="text-sm mt-1">Add images and assets to use in your blog posts</p>
              <Button className="mt-4" onClick={() => setUploadDialog(true)}><Upload size={14} /> Add Media</Button>
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x225/e5e7eb/9ca3af?text=${getMimeLabel(item.mimeType)}`; }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyUrl(item.url)}>
                    <Copy size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 size={14} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This file will be permanently removed from the library.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{item.size || "—"}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{getMimeLabel(item.mimeType)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="w-16 h-10 object-cover rounded-md flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x40/e5e7eb/9ca3af?text=FILE`; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                </div>
                <Badge variant="outline" className="text-xs">{getMimeLabel(item.mimeType)}</Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(item.url)}>
                    <Copy size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This file will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Media Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
            <DialogDescription>Add an image or file by URL. S3 and Cloudflare R2 support coming soon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Storage Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm(p => ({ ...p, provider: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">🔗 URL / Link (Active)</SelectItem>
                  <SelectItem value="s3" disabled>☁️ Amazon S3 (Coming Soon)</SelectItem>
                  <SelectItem value="r2" disabled>☁️ Cloudflare R2 (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File URL *</Label>
              <Input placeholder="https://example.com/image.jpg" value={form.url} onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input placeholder="hero-image.jpg" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Leave blank to auto-detect from URL</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>File Type</Label>
                <Select value={form.mimeType} onValueChange={(v) => setForm(p => ({ ...p, mimeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                    <SelectItem value="image/svg+xml">SVG</SelectItem>
                    <SelectItem value="image/gif">GIF</SelectItem>
                    <SelectItem value="application/pdf">PDF</SelectItem>
                    <SelectItem value="video/mp4">MP4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Size (optional)</Label>
                <Input placeholder="248 KB" value={form.size} onChange={(e) => setForm(p => ({ ...p, size: e.target.value }))} />
              </div>
            </div>
            {form.url && (
              <div className="rounded-lg overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.url} alt="Preview" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Add to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
