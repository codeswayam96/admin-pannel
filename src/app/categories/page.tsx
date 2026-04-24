"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  blogCount: number;
  createdAt: string;
}

const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];
const emptyForm = { name: "", slug: "", description: "", color: colors[0] };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCategories()
      .then(setCategories)
      .catch((err) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditCat(null); setDialogOpen(true); };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, description: c.description || "", color: c.color || colors[0] });
    setEditCat(c);
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm(p => ({ ...p, name: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    try {
      if (editCat) {
        const updated = await updateCategory(editCat.id, { name: form.name, slug: form.slug, description: form.description, color: form.color });
        setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...updated } : c));
        toast.success("Category updated!");
      } else {
        const created = await createCategory({ name: form.name, slug: form.slug, description: form.description, color: form.color });
        setCategories(prev => [...prev, { ...created, blogCount: 0 }]);
        toast.success("Category created!");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted");
    } catch { toast.error("Failed to delete category"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your blog posts with categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} /> New Category
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Tag size={14} /> {categories.length} categories</span>
        <span>·</span>
        <span>{categories.reduce((s, c) => s + c.blogCount, 0)} total posts</span>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No categories yet</p>
          <p className="text-sm mt-1">Create your first category to organize blog posts</p>
          <Button className="mt-4" onClick={openCreate}><Plus size={14} /> Create Category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
                      style={{ background: cat.color || colors[0] }}
                    >
                      {cat.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">/{cat.slug}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil size={13} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 size={13} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete &quot;{cat.name}&quot;?</AlertDialogTitle>
                          <AlertDialogDescription>Posts in this category won&apos;t be deleted but will be uncategorized.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{cat.description || "No description"}</p>
                <Badge variant="secondary" className="text-xs">{cat.blogCount} posts</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>{editCat ? "Update this category." : "Create a new blog category."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="SaaS" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input placeholder="saas" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Used in URLs: /category/{form.slug || "slug"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Brief description..." value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded-full cursor-pointer border" title="Custom color" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editCat ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
