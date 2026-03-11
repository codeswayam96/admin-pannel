"use client";

import { useState } from "react";
import { Upload, Copy, Trash2, Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface MediaItem {
  id: number;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedAt: string;
}

const placeholderImages = [
  { id: 1, name: "hero-banner.jpg", url: "https://picsum.photos/seed/1/800/450", size: "248 KB", type: "image/jpeg", uploadedAt: "Mar 10, 2026" },
  { id: 2, name: "product-screenshot.png", url: "https://picsum.photos/seed/2/800/450", size: "512 KB", type: "image/png", uploadedAt: "Mar 9, 2026" },
  { id: 3, name: "team-photo.jpg", url: "https://picsum.photos/seed/3/800/450", size: "189 KB", type: "image/jpeg", uploadedAt: "Mar 8, 2026" },
  { id: 4, name: "feature-1.jpg", url: "https://picsum.photos/seed/4/800/450", size: "301 KB", type: "image/jpeg", uploadedAt: "Mar 7, 2026" },
  { id: 5, name: "dashboard-preview.png", url: "https://picsum.photos/seed/5/800/450", size: "450 KB", type: "image/png", uploadedAt: "Mar 5, 2026" },
  { id: 6, name: "blog-cover-1.jpg", url: "https://picsum.photos/seed/6/800/450", size: "234 KB", type: "image/jpeg", uploadedAt: "Mar 3, 2026" },
  { id: 7, name: "saas-analytics.png", url: "https://picsum.photos/seed/7/800/450", size: "675 KB", type: "image/png", uploadedAt: "Feb 28, 2026" },
  { id: 8, name: "code-snippet.jpg", url: "https://picsum.photos/seed/8/800/450", size: "178 KB", type: "image/jpeg", uploadedAt: "Feb 25, 2026" },
  { id: 9, name: "infographic.png", url: "https://picsum.photos/seed/9/800/450", size: "922 KB", type: "image/png", uploadedAt: "Feb 20, 2026" },
];

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>(placeholderImages);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = media.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const deleteItem = (id: number) => {
    setMedia(prev => prev.filter(m => m.id !== id));
    toast.success("File deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">{media.length} files · Manage images and assets</p>
        </div>
        <Button>
          <Upload size={16} /> Upload Files
        </Button>
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

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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
                        <AlertDialogDescription>This file will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItem(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{item.size}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{item.type.split("/")[1].toUpperCase()}</Badge>
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
                <img src={item.url} alt={item.name} className="w-16 h-10 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.size} · {item.uploadedAt}</p>
                </div>
                <Badge variant="outline" className="text-xs">{item.type.split("/")[1].toUpperCase()}</Badge>
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
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItem(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
