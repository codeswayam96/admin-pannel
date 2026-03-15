"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, MoreVertical, Filter, Loader2, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ErrorState } from "@/components/ErrorState";
import { fetchBlogs, deleteBlog, updateBlog } from "@/lib/api";

interface Blog {
  id: number;
  saas: string;
  tag: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured: string | null;
  status: string;
  views: number;
  category: string;
  authorId: number;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  archived: "bg-gray-100 text-gray-600",
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBlogs()
      .then(setBlogs)
      .catch((err) => setError(err.message || "Failed to load blogs"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = blogs.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.authorName || b.authorEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const published = blogs.filter(b => b.status === "published").length;
  const draft = blogs.filter(b => b.status === "draft").length;
  const archived = blogs.filter(b => b.status === "archived").length;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blog deleted successfully");
    } catch {
      toast.error("Failed to delete blog");
    }
    setDeletingId(null);
  };

  const changeStatus = async (blog: Blog, newStatus: string) => {
    try {
      const updated = await updateBlog(blog.id, { status: newStatus });
      setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, ...updated } : b));
      toast.success(`Blog marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update blog");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} />;
  }

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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Blogs", value: blogs.length, active: true },
          { label: "Published", value: published },
          { label: "Draft", value: draft },
          { label: "Archived", value: archived },
        ].map((s) => (
          <Card key={s.label} className={s.active ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
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
                <SelectValue placeholder="All Status" />
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
                filtered.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <p className="font-medium line-clamp-1">{blog.title}</p>
                      <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {blog.authorName || blog.authorEmail || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium">
                        {blog.category || blog.tag || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[blog.status] || "bg-gray-100 text-gray-600"}`}>
                        {blog.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {blog.views > 0 ? (
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {blog.views.toLocaleString()}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingId === blog.id}>
                            {deletingId === blog.id ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/blogs/${blog.id}/edit`}>
                              <Pencil size={14} className="mr-2" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {blog.status !== "published" && (
                            <DropdownMenuItem onClick={() => changeStatus(blog, "published")}>
                              Publish
                            </DropdownMenuItem>
                          )}
                          {blog.status !== "draft" && (
                            <DropdownMenuItem onClick={() => changeStatus(blog, "draft")}>
                              Move to Draft
                            </DropdownMenuItem>
                          )}
                          {blog.status !== "archived" && (
                            <DropdownMenuItem onClick={() => changeStatus(blog, "archived")}>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
