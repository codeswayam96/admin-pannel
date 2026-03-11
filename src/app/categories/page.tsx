"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  blogCount: number;
  color: string;
}

const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

const initialCategories: Category[] = [
  { id: 1, name: "SaaS", slug: "saas", description: "Software as a Service insights and tools", blogCount: 24, color: "#8b5cf6" },
  { id: 2, name: "Development", slug: "development", description: "Software development tutorials and best practices", blogCount: 42, color: "#3b82f6" },
  { id: 3, name: "Frontend", slug: "frontend", description: "UI/UX, CSS, React, and more", blogCount: 31, color: "#10b981" },
  { id: 4, name: "Backend", slug: "backend", description: "APIs, databases, server architecture", blogCount: 18, color: "#f59e0b" },
  { id: 5, name: "AI/ML", slug: "ai-ml", description: "Artificial intelligence and machine learning", blogCount: 12, color: "#ef4444" },
  { id: 6, name: "DevOps", slug: "devops", description: "CI/CD, Docker, Kubernetes, cloud", blogCount: 9, color: "#06b6d4" },
  { id: 7, name: "Design", slug: "design", description: "UI design, Figma, design systems", blogCount: 7, color: "#ec4899" },
];

const emptyForm = { name: "", slug: "", description: "", color: colors[0] };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setForm(emptyForm); setEditCat(null); setDialogOpen(true); };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, description: c.description, color: c.color });
    setEditCat(c); setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm(p => ({ ...p, name: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (editCat) {
      setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...form } : c));
      toast.success("Category updated!");
    } else {
      setCategories(prev => [...prev, { id: prev.length + 1, ...form, blogCount: 0 }]);
      toast.success("Category created!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success("Category deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your blog posts with categories</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> New Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base" style={{ background: cat.color }}>
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
              <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
              <Badge variant="secondary" className="text-xs">{cat.blogCount} posts</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

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
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Brief description..." value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editCat ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
