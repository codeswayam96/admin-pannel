"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Eye, MoreVertical, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type BlogStatus = "published" | "draft" | "archived";

interface Blog {
  id: number;
  title: string;
  author: string;
  category: string;
  status: BlogStatus;
  views: number;
  date: string;
  slug: string;
}

const initialBlogs: Blog[] = [
  { id: 1, title: "Top 10 SaaS Tools in 2026", author: "Niteesh Kumar", category: "SaaS", status: "published", views: 12400, date: "Mar 10, 2026", slug: "top-10-saas-tools-2026" },
  { id: 2, title: "Getting Started with React 19", author: "Priya Sharma", category: "Development", status: "published", views: 9870, date: "Mar 8, 2026", slug: "getting-started-react-19" },
  { id: 3, title: "Mastering TypeScript Generics", author: "Arjun Mehta", category: "Development", status: "published", views: 7230, date: "Mar 5, 2026", slug: "mastering-typescript-generics" },
  { id: 4, title: "Building Scalable APIs with Next.js", author: "Niteesh Kumar", category: "Backend", status: "published", views: 5640, date: "Mar 2, 2026", slug: "scalable-apis-nextjs" },
  { id: 5, title: "Database Design for SaaS Apps", author: "Priya Sharma", category: "Backend", status: "draft", views: 0, date: "Mar 11, 2026", slug: "database-design-saas" },
  { id: 6, title: "Understanding SaaS Metrics", author: "Niteesh Kumar", category: "SaaS", status: "draft", views: 0, date: "Mar 11, 2026", slug: "understanding-saas-metrics" },
  { id: 7, title: "CSS Grid Mastery", author: "Arjun Mehta", category: "Frontend", status: "archived", views: 2100, date: "Feb 20, 2026", slug: "css-grid-mastery" },
  { id: 8, title: "Intro to Machine Learning with Python", author: "Priya Sharma", category: "AI/ML", status: "published", views: 4110, date: "Feb 28, 2026", slug: "intro-ml-python" },
];

const statusConfig: Record<BlogStatus, { label: string; variant: "success" | "warning" | "secondary" }> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "warning" },
  archived: { label: "Archived", variant: "secondary" },
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = blogs.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: number) => {
    setBlogs((prev) => prev.filter((b) => b.id !== id));
    toast.success("Blog deleted successfully");
  };

  const handleStatusChange = (id: number, status: BlogStatus) => {
    setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    toast.success(`Blog ${status === "published" ? "published" : status === "draft" ? "moved to draft" : "archived"}`);
  };

  const counts = {
    all: blogs.length,
    published: blogs.filter(b => b.status === "published").length,
    draft: blogs.filter(b => b.status === "draft").length,
    archived: blogs.filter(b => b.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground mt-1">Create and manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href="/blogs/new">
            <Plus size={16} />
            New Blog Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["all", "published", "draft", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-3 rounded-lg border text-left transition-all ${statusFilter === s ? "border-violet-500 bg-violet-50" : "bg-background hover:bg-muted/50"}`}
          >
            <p className="text-2xl font-bold">{counts[s]}</p>
            <p className="text-xs text-muted-foreground capitalize">{s === "all" ? "Total Blogs" : s}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search blogs by title or author..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No blogs found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((blog) => {
                  const sc = statusConfig[blog.status];
                  return (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <p className="font-medium line-clamp-1">{blog.title}</p>
                        <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{blog.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{blog.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{blog.views > 0 ? blog.views.toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{blog.date}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/blogs/${blog.id}/edit`}>
                                <Pencil size={14} className="mr-2" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye size={14} className="mr-2" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {blog.status !== "published" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(blog.id, "published")} className="text-emerald-600">
                                Publish
                              </DropdownMenuItem>
                            )}
                            {blog.status !== "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(blog.id, "draft")}>
                                Move to Draft
                              </DropdownMenuItem>
                            )}
                            {blog.status !== "archived" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(blog.id, "archived")} className="text-amber-600">
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 size={14} className="mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete &quot;{blog.title}&quot;?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The blog post will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(blog.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
