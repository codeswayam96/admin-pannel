"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/TiptapEditor";
import { toast } from "sonner";
import { fetchBlog, updateBlog } from "@/lib/api";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState("no");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    tag: "",
    saas: "",
  });

  useEffect(() => {
    fetchBlog(Number(id))
      .then((blog) => {
        setForm({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          tag: blog.tag || "",
          saas: blog.saas || "",
        });
        setContent(blog.content || "");
        setFeatured(blog.featured || "no");
      })
      .catch(() => toast.error("Failed to load blog"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    setSaving(true);
    try {
      await updateBlog(Number(id), {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        tag: form.tag,
        saas: form.saas,
        content,
        featured,
      });
      toast.success("Blog updated successfully!");
      router.push("/blogs");
    } catch {
      toast.error("Failed to update blog");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <p className="text-sm text-muted-foreground">ID: {id} — make your changes below</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={featured === "yes" ? "default" : "secondary"} className="capitalize px-3 py-1">
            <BookOpen size={12} className="mr-1.5" />{featured === "yes" ? "Featured" : "Regular"}
          </Badge>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} />} Update
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
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Publish</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Featured</Label>
                <Select value={featured} onValueChange={setFeatured}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                Update Post
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tag</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} placeholder="development, saas..." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">SaaS</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.saas} onChange={(e) => setForm((p) => ({ ...p, saas: e.target.value }))} placeholder="codeswayam" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
