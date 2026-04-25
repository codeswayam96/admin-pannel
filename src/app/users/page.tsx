"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, ShieldAlert, UserCheck, Mail, Calendar, Loader2, Users, UserPlus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ErrorState } from "@/components/ErrorState";
import { fetchUsers, updateUserRole, updateUserStatus, deleteUser, inviteUser } from "@/lib/api";

type UserRole = "user" | "admin" | "superadmin" | "editor" | "viewer" | "subscriber";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  superadmin: "bg-violet-100 text-violet-700",
  admin: "bg-cyan-100 text-cyan-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-700",
  subscriber: "bg-purple-100 text-purple-700",
  user: "bg-slate-100 text-slate-700",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};

const avatarColors = [
  "bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700",
];

function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: number) { return avatarColors[id % avatarColors.length]; }

function formatLastActive(date: string | null) {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Invite dialog
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (u.status || "active") === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const changeRole = async (id: number, role: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateUserRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
      toast.success("User role updated");
    } catch { toast.error("Failed to update role"); }
    setUpdatingId(null);
  };

  const changeStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      toast.success(`User ${status === "active" ? "activated" : status}`);
    } catch { toast.error("Failed to update status"); }
    setUpdatingId(null);
  };

  const handleDelete = async (id: number) => {
    setUpdatingId(id);
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("User deleted");
    } catch (err: any) { toast.error(err.message || "Failed to delete user"); }
    setUpdatingId(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) { toast.error("Valid email is required"); return; }
    setInviting(true);
    try {
      await inviteUser(inviteEmail, inviteRole);
      toast.success(`Invite sent to ${inviteEmail}! They can login with the temp password.`);
      setInviteDialog(false);
      setInviteEmail("");
      setInviteRole("user");
      // Reload users
      const updated = await fetchUsers();
      setUsers(updated);
    } catch (err: any) { toast.error(err.message || "Failed to invite user"); }
    setInviting(false);
  };

  const counts = {
    total: users.length,
    active: users.filter(u => (u.status || "active") === "active").length,
    admins: users.filter(u => u.role === "admin" || u.role === "superadmin").length,
    suspended: users.filter(u => u.status === "suspended").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts, roles, and status</p>
        </div>
        <Button onClick={() => setInviteDialog(true)} className="w-full sm:w-auto">
          <UserPlus size={16} /> Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-100"><Users size={18} className="text-violet-600" /></div>
            <div><p className="text-2xl font-bold">{counts.total}</p><p className="text-sm text-muted-foreground">Total Users</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-100"><UserCheck size={18} className="text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{counts.active}</p><p className="text-sm text-muted-foreground">Active</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-blue-100"><Shield size={18} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{counts.admins}</p><p className="text-sm text-muted-foreground">Admins</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-red-100"><ShieldAlert size={18} className="text-red-600" /></div>
            <div><p className="text-2xl font-bold">{counts.suspended}</p><p className="text-sm text-muted-foreground">Suspended</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="subscriber">Subscriber</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const rc = roleColors[user.role] || roleColors.user;
                const sc = statusColors[user.status || "active"] || statusColors.active;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(user.id)}`}>
                          {getInitials(user.name, user.email)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name || "—"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail size={11} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${rc}`}>{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${sc}`}>{user.status || "active"}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={12} />{formatLastActive(user.lastActiveAt)}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={12} />{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingId === user.id}>
                            {updatingId === user.id ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          {(["user", "admin", "superadmin", "editor", "viewer", "subscriber"] as UserRole[]).filter(r => r !== user.role).map(r => (
                            <DropdownMenuItem key={r} onClick={() => changeRole(user.id, r)} className="capitalize">{r}</DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {(["active", "suspended", "pending"] as const).filter(s => s !== (user.status || "active")).map(s => (
                            <DropdownMenuItem key={s} onClick={() => changeStatus(user.id, s)} className="capitalize">
                              {s === "suspended" ? "Suspend" : s === "active" ? "Activate" : "Set Pending"}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 size={13} className="mr-2" /> Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {user.email}?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the user and all their data. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(user.id)}>Delete Permanently</AlertDialogAction>
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
        </div>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation email with temporary login credentials. They&apos;ll be prompted to change their password on first login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInvite()} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="subscriber">Subscriber</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-3 py-2.5">
              <p className="text-xs text-amber-700 dark:text-amber-400">An email will be sent with a temporary password. Configure <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">SMTP_USER</code> in your environment for real email delivery.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
