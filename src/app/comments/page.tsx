"use client";

import { useState } from "react";
import { Check, X, Trash2, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type CommentStatus = "pending" | "approved" | "spam";

interface Comment {
  id: number;
  author: string;
  email: string;
  content: string;
  post: string;
  status: CommentStatus;
  date: string;
  avatar: string;
}

const initialComments: Comment[] = [
  { id: 1, author: "Priya Sharma", email: "priya@email.com", content: "Great article! The SaaS tools you mentioned are really helpful for startups.", post: "Top 10 SaaS Tools in 2026", status: "approved", date: "Mar 11, 2026", avatar: "PS" },
  { id: 2, author: "Arjun Mehta", email: "arjun@email.com", content: "Could you write more about pricing strategies for SaaS products?", post: "Top 10 SaaS Tools in 2026", status: "pending", date: "Mar 11, 2026", avatar: "AM" },
  { id: 3, author: "Sneha Patel", email: "sneha@email.com", content: "I&apos;ve been using React 19 for 2 months now, the concurrent features are amazing!", post: "Getting Started with React 19", status: "approved", date: "Mar 10, 2026", avatar: "SP" },
  { id: 4, author: "Rahul Verma", email: "rahul@email.com", content: "Buy cheap meds online! Click here...", post: "Building Scalable APIs with Next.js", status: "spam", date: "Mar 9, 2026", avatar: "RV" },
  { id: 5, author: "Kavya Reddy", email: "kavya@email.com", content: "The TypeScript generics section was confusing. Can you add more examples?", post: "Mastering TypeScript Generics", status: "pending", date: "Mar 9, 2026", avatar: "KR" },
  { id: 6, author: "Vikram Nair", email: "vikram@email.com", content: "Excellent write-up on database design! The normalization examples were spot-on.", post: "Database Design for SaaS Apps", status: "pending", date: "Mar 8, 2026", avatar: "VN" },
];

const statusConfig: Record<CommentStatus, { variant: "success" | "warning" | "destructive" }> = {
  approved: { variant: "success" },
  pending: { variant: "warning" },
  spam: { variant: "destructive" },
};

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = comments.filter(c =>
    (c.author.toLowerCase().includes(search.toLowerCase()) || c.content.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || c.status === statusFilter)
  );

  const approve = (id: number) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as CommentStatus } : c));
    toast.success("Comment approved");
  };

  const markSpam = (id: number) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: "spam" as CommentStatus } : c));
    toast.success("Marked as spam");
  };

  const deleteComment = (id: number) => {
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success("Comment deleted");
  };

  const counts = { all: comments.length, pending: comments.filter(c => c.status === "pending").length, approved: comments.filter(c => c.status === "approved").length, spam: comments.filter(c => c.status === "spam").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comments</h1>
          <p className="text-muted-foreground mt-1">Moderate blog comments and engagement</p>
        </div>
        {counts.pending > 0 && <Badge variant="warning" className="text-sm px-3 py-1 gap-1.5"><MessageSquare size={13} /> {counts.pending} pending review</Badge>}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "spam"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search comments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((comment) => {
          const sc = statusConfig[comment.status];
          return (
            <Card key={comment.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.email}</span>
                          <Badge variant={sc.variant} className="capitalize text-xs">{comment.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          On: <span className="text-violet-600 font-medium">{comment.post}</span> · {comment.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"><Trash2 size={15} /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                              <AlertDialogDescription>This comment will be permanently removed.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteComment(comment.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            <p>No comments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
