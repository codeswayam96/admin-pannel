"use client";

import { useState, useEffect } from "react";
import { Check, X, Trash2, MessageSquare, Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchComments, updateCommentStatus, deleteComment } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { usePagination, Pagination } from "@/components/Pagination";

type CommentStatus = "pending" | "approved" | "spam";

interface Comment {
  id: number;
  authorName: string;
  authorEmail: string;
  content: string;
  blogTitle: string | null;
  blogId: number | null;
  status: CommentStatus;
  createdAt: string;
}

const statusConfig: Record<CommentStatus, { variant: "success" | "warning" | "destructive" }> = {
  approved: { variant: "success" },
  pending: { variant: "warning" },
  spam: { variant: "destructive" },
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchComments()
      .then(setComments)
      .catch((err) => setError(err.message || "Failed to load comments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = comments.filter(c =>
    (c.authorName.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.authorEmail || "").toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || c.status === statusFilter)
  );

  const { page, setPage, pageSize, changePageSize, totalPages, paginated, total } = usePagination(filtered, 20);

  const approve = async (id: number) => {
    setUpdatingId(id);
    try {
      await updateCommentStatus(id, "approved");
      setComments(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as CommentStatus } : c));
      toast.success("Comment approved");
    } catch { toast.error("Failed to update comment"); }
    setUpdatingId(null);
  };

  const markSpam = async (id: number) => {
    setUpdatingId(id);
    try {
      await updateCommentStatus(id, "spam");
      setComments(prev => prev.map(c => c.id === id ? { ...c, status: "spam" as CommentStatus } : c));
      toast.success("Marked as spam");
    } catch { toast.error("Failed to update comment"); }
    setUpdatingId(null);
  };

  const handleDelete = async (id: number) => {
    setUpdatingId(id);
    try {
      await deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success("Comment deleted");
    } catch { toast.error("Failed to delete comment"); }
    setUpdatingId(null);
  };

  const counts = {
    all: comments.length,
    pending: comments.filter(c => c.status === "pending").length,
    approved: comments.filter(c => c.status === "approved").length,
    spam: comments.filter(c => c.status === "spam").length,
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
          <h1 className="text-3xl font-bold tracking-tight">Comments</h1>
          <p className="text-muted-foreground mt-1 ">Moderate blog comments and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <Badge variant="warning" className="text-sm px-3 py-1 gap-1.5">
              <MessageSquare size={13} /> {counts.pending} pending review
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "spam"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search comments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {paginated.map((comment) => {
          const sc = statusConfig[comment.status];
          const isUpdating = updatingId === comment.id;
          return (
            <Card key={comment.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {getInitials(comment.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">{comment.authorEmail}</span>
                          <Badge variant={sc.variant} className="capitalize text-xs">{comment.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {comment.blogTitle ? (
                            <>On: <span className="text-violet-600 font-medium">{comment.blogTitle}</span> · </>
                          ) : null}
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isUpdating ? (
                          <Loader2 size={16} className="animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {comment.status !== "approved" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => approve(comment.id)}>
                                <Check size={15} />
                              </Button>
                            )}
                            {comment.status !== "spam" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => markSpam(comment.id)}>
                                <X size={15} />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50">
                                  <Trash2 size={15} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                                  <AlertDialogDescription>This comment will be permanently removed.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(comment.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>{comments.length === 0 ? "No comments yet. They will appear here once users engage with your blog posts." : "No comments match your filter."}</p>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            <Pagination
              page={page} totalPages={totalPages} total={total} pageSize={pageSize}
              onPageChange={setPage} onPageSizeChange={changePageSize}
              label="comments"
            />
          </div>
        )}
      </div>
    </div>
  );
}
