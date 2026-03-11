"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/TiptapEditor";
import { toast } from "sonner";

export default function NewBlogPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    tags: "",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
  });

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
  };

  const handleSave = (publishStatus: string) => {
    if (!form.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    toast.success(publishStatus === "published" ? "Blog published successfully!" : "Draft saved!");
    router.push("/blogs");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blogs"><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Blog Post</h1>
            <p className="text-sm text-muted-foreground">Write and publish a new article</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === "published" ? "success" : "warning"} className="capitalize px-3 py-1">
            <BookOpen size={12} className="mr-1.5" />{status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")}>
            <Save size={14} /> Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave("published")}>
            <Eye size={14} /> Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="xl:col-span-3 space-y-6">
          {/* Title */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling blog title..."
                  className="text-lg h-12"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/blog/</span>
                  <Input
                    id="slug"
                    placeholder="your-blog-slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Write a short summary of this post (used for previews and SEO)..."
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-0">
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your amazing blog post..."
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  placeholder="SEO title (60 chars recommended)"
                  value={form.metaTitle}
                  onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{form.metaTitle.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  placeholder="SEO description (160 chars recommended)"
                  rows={2}
                  value={form.metaDescription}
                  onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{form.metaDescription.length}/160 characters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="xl:col-span-1 space-y-4">
          {/* Publish */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Publish</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => handleSave(status)}>
                {status === "published" ? "Publish Now" : "Save"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleSave("draft")}>
                Save as Draft
              </Button>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="ai-ml">AI/ML</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tags</CardTitle></CardHeader>
            <CardContent>
              <Input
                placeholder="react, nextjs, typescript..."
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1.5">Separate tags with commas</p>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cover Image</CardTitle></CardHeader>
            <CardContent>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
              />
              {form.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverImage} alt="Cover" className="mt-3 w-full h-32 object-cover rounded-lg" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
