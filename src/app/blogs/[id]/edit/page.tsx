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

// Simulating fetched blog data
const mockBlog = {
  id: 1,
  title: "Top 10 SaaS Tools in 2026",
  slug: "top-10-saas-tools-2026",
  excerpt: "Discover the most powerful SaaS tools that are transforming businesses in 2026.",
  category: "saas",
  tags: "saas, tools, productivity",
  coverImage: "",
  status: "published",
  metaTitle: "Top 10 SaaS Tools in 2026 | CodeSwayam",
  metaDescription: "A complete guide to the best SaaS tools available today for scaling your business.",
  content: "<h2>Introduction</h2><p>The SaaS landscape has grown exponentially...</p>",
};

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const blog = mockBlog; // In production: fetch by params.id
  
  const [content, setContent] = useState(blog.content);
  const [status, setStatus] = useState(blog.status);
  const [form, setForm] = useState({
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    category: blog.category,
    tags: blog.tags,
    coverImage: blog.coverImage,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
  });

  const handleSave = (publishStatus: string) => {
    if (!form.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    toast.success(publishStatus === "published" ? "Blog updated and published!" : "Changes saved as draft!");
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
            <h1 className="text-2xl font-bold">Edit Blog Post</h1>
            <p className="text-sm text-muted-foreground">ID: {params.id} — make your changes below</p>
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
            <Eye size={14} /> Update & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input id="title" className="text-lg h-12" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Content</CardTitle></CardHeader>
            <CardContent className="p-0 pb-0">
              <TiptapEditor content={content} onChange={setContent} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))} />
                <p className="text-xs text-muted-foreground">{form.metaTitle.length}/60</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea rows={2} value={form.metaDescription} onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))} />
                <p className="text-xs text-muted-foreground">{form.metaDescription.length}/160</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Publish</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => handleSave(status)}>Update Post</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Category</CardTitle></CardHeader>
            <CardContent>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="ai-ml">AI/ML</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tags</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="react, nextjs..." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cover Image</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.coverImage} onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
