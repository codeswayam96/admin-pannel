"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, ShieldAlert, UserCheck, Mail, Calendar, Loader2, Users, UserPlus, Clock, Trash2, Globe, Download, CheckSquare2, Square, MinusSquare } from "lucide-react";
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
import { UserDeepDive } from "@/components/users/UserDeepDive";
import { fetchUsers, updateUserRole, updateUserStatus, deleteUser, inviteUser, sendNotificationCampaign } from "@/lib/api";
import { usePagination, Pagination } from "@/components/Pagination";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { exportToCSV, exportToJSON } from "@/lib/export/csv-exporter";
import { exportToPDF } from "@/lib/export/pdf-exporter";

type UserRole = "user" | "admin" | "superadmin" | "editor" | "viewer" | "subscriber";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
  signupSource?: string | null;
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

// Deterministic colour per source string
const SOURCE_PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function sourceColor(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  return SOURCE_PALETTES[hash % SOURCE_PALETTES.length];
}

function formatSource(raw: string | null | undefined): string {
  if (!raw) return "Direct";
  // Strip common suffixes to get a clean label: "auraflow.codeswayam.com" → "auraflow"
  return raw
    .replace(/\.codeswayam\.com$/, "")
    .replace(/^https?:\/\//, "")
    .replace(/localhost(:\d+)?/, "localhost")
    .split(".")[0];
}

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

function formatLastActive(date: string | null, status?: string, createdAt?: string | null) {
  const effectiveDate = date || (status === "active" ? createdAt : null);
  if (!effectiveDate) return "Never";
  const d = new Date(effectiveDate);
  if (isNaN(d.getTime())) return "Never";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return d.toLocaleDateString();
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
  const [searchBy, setSearchBy] = useState<"all" | "id" | "name" | "email">("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Invite dialog
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bulk role select state
  const [bulkRole, setBulkRole] = useState<string>("");

  // Bulk notification state
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationUrl, setNotificationUrl] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  // Unique sources for filter dropdown
  const allSources = Array.from(
    new Set(users.map(u => formatSource(u.signupSource)))
  ).sort();

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    let matchSearch = true;
    if (q) {
      const cleanId = q.replace(/^#/, "");
      if (searchBy === "id") {
        matchSearch = String(u.id).includes(cleanId) || `#${u.id}`.toLowerCase().includes(q);
      } else if (searchBy === "name") {
        matchSearch = (u.name || "").toLowerCase().includes(q);
      } else if (searchBy === "email") {
        matchSearch = u.email.toLowerCase().includes(q);
      } else {
        matchSearch =
          (u.name || "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id).includes(cleanId) ||
          `#${u.id}`.toLowerCase().includes(q);
      }
    }
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (u.status || "active") === statusFilter;
    const matchSource = sourceFilter === "all" || formatSource(u.signupSource) === sourceFilter;
    return matchSearch && matchRole && matchStatus && matchSource;
  });

  const { page, setPage, pageSize, changePageSize, totalPages, paginated, total } = usePagination(filtered, 20);

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
      const updated = await fetchUsers();
      setUsers(updated);
    } catch (err: any) { toast.error(err.message || "Failed to invite user"); }
    setInviting(false);
  };

  // Bulk operations
  const allPageSelected = paginated.length > 0 && paginated.every(u => selectedIds.has(u.id));
  const somePageSelected = paginated.some(u => selectedIds.has(u.id)) && !allPageSelected;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(u => n.delete(u.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(u => n.add(u.id)); return n; });
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const bulkSuspend = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => updateUserStatus(id, 'suspended')));
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: 'suspended' } : u));
      toast.success(`${selectedIds.size} users suspended`);
      setSelectedIds(new Set());
    } catch { toast.error('Bulk suspend failed'); }
    setBulkLoading(false);
  };

  const bulkActivate = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => updateUserStatus(id, 'active')));
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: 'active' } : u));
      toast.success(`${selectedIds.size} users activated`);
      setSelectedIds(new Set());
    } catch { toast.error('Bulk activate failed'); }
    setBulkLoading(false);
  };

  const bulkChangeRole = async (role: string) => {
    if (!role) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => updateUserRole(id, role)));
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, role: role as UserRole } : u));
      toast.success(`${selectedIds.size} users updated to ${role}`);
      setSelectedIds(new Set());
      setBulkRole("");
    } catch { toast.error('Bulk role change failed'); }
    setBulkLoading(false);
  };

  const handleBulkNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSendingNotification(true);
    try {
      await sendNotificationCampaign({
        title: notificationTitle.trim(),
        body: notificationBody.trim(),
        url: notificationUrl.trim() || undefined,
        audience: "segment",
        userIds: Array.from(selectedIds),
      });
      toast.success(`Notification sent to ${selectedIds.size} users`);
      setNotificationDialog(false);
      setNotificationTitle("");
      setNotificationBody("");
      setNotificationUrl("");
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Failed to send notifications");
    }
    setSendingNotification(false);
  };

  const getUsersForExport = () => {
    if (selectedIds.size > 0) {
      return users.filter((u) => selectedIds.has(u.id));
    }
    return filtered.length > 0 ? filtered : users;
  };

  const handleExportUsers = async (format: 'csv' | 'pdf' | 'json') => {
    const targetUsers = getUsersForExport();
    if (targetUsers.length === 0) {
      toast.error('No users available to export');
      return;
    }

    const exportRows = targetUsers.map((u) => {
      const effLastActive = u.lastActiveAt || (u.status === "active" ? u.createdAt : null);
      return {
        id: u.id,
        name: u.name || '—',
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        signupSource: formatSource(u.signupSource),
        lastActive: effLastActive ? new Date(effLastActive).toLocaleString() : 'Never',
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
      };
    });

    if (format === 'csv') {
      exportToCSV(exportRows, 'users_export', [
        { key: 'id', header: 'User ID' },
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'status', header: 'Status' },
        { key: 'signupSource', header: 'Signup Source' },
        { key: 'lastActive', header: 'Last Active' },
        { key: 'joinedDate', header: 'Joined Date' },
      ]);
      toast.success(`Exported ${exportRows.length} users to CSV`);
    } else if (format === 'pdf') {
      await exportToPDF(
        exportRows,
        'users_export',
        [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status' },
          { key: 'signupSource', header: 'Source' },
          { key: 'joinedDate', header: 'Joined' },
        ],
        {
          title: 'Users Directory Export',
          subtitle: `Total: ${exportRows.length} users • Exported on ${new Date().toLocaleDateString()}`,
        }
      );
      toast.success(`Exported ${exportRows.length} users to PDF`);
    } else if (format === 'json') {
      exportToJSON(exportRows, 'users_export');
      toast.success(`Exported ${exportRows.length} users to JSON`);
    }
  };

  // Source breakdown for top sources stat
  const sourceCounts = users.reduce<Record<string, number>>((acc, u) => {
    const s = formatSource(u.signupSource);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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
        <div className="flex items-center gap-2">
          <ExportButton
            onExportCSV={() => handleExportUsers('csv')}
            onExportPDF={() => handleExportUsers('pdf')}
            onExportJSON={() => handleExportUsers('json')}
            count={selectedIds.size > 0 ? selectedIds.size : filtered.length}
            label={selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export'}
          />
          <Button onClick={() => setInviteDialog(true)} className="w-full sm:w-auto">
            <UserPlus size={16} /> Invite User
          </Button>
        </div>
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
            <div className="p-2.5 rounded-lg bg-amber-100"><Globe size={18} className="text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground mb-1.5">Top Sources</p>
              <div className="flex flex-wrap gap-1">
                {topSources.length === 0
                  ? <span className="text-xs text-muted-foreground">—</span>
                  : topSources.map(([src, count]) => (
                    <span key={src} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${sourceColor(src)}`}>
                      {src} <span className="opacity-60">·{count}</span>
                    </span>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex flex-1 sm:max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                searchBy === "id"
                  ? "Search by User ID (e.g. 5 or #5)..."
                  : searchBy === "name"
                  ? "Search by name..."
                  : searchBy === "email"
                  ? "Search by email..."
                  : "Search by name, email, or ID..."
              }
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={searchBy} onValueChange={(val) => setSearchBy(val as any)}>
            <SelectTrigger className="w-[125px] shrink-0">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="id">User ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
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
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {allSources.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl animate-in slide-in-from-top-2 duration-200 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
            <CheckSquare2 size={16} />
            {selectedIds.size} selected
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={bulkRole} onValueChange={(val) => { setBulkRole(val); bulkChangeRole(val); }} disabled={bulkLoading}>
              <SelectTrigger className="h-8 text-xs w-[130px] border-violet-200 text-violet-700 bg-white hover:bg-violet-50/50">
                <SelectValue placeholder="Change Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="subscriber">Subscriber</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={bulkActivate} disabled={bulkLoading} className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              {bulkLoading && bulkRole === "" ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={bulkSuspend} disabled={bulkLoading} className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50">
              Suspend
            </Button>
            <Button size="sm" variant="outline" onClick={() => setNotificationDialog(true)} className="h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50">
              Send Alert
            </Button>
            <ExportButton
              onExportCSV={() => handleExportUsers('csv')}
              onExportPDF={() => handleExportUsers('pdf')}
              onExportJSON={() => handleExportUsers('json')}
              count={selectedIds.size}
              label="Export Selected"
              className="h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
            />
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 text-xs text-muted-foreground">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center">
                    {allPageSelected ? (
                      <CheckSquare2 size={16} className="text-violet-600" />
                    ) : somePageSelected ? (
                      <MinusSquare size={16} className="text-violet-400" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signup Source</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => {
                  const rc = roleColors[user.role] || roleColors.user;
                  const sc = statusColors[user.status || "active"] || statusColors.active;
                  const src = formatSource(user.signupSource);
                  const srcColor = sourceColor(src);
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer ${isSelected ? 'bg-violet-50/50' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell onClick={e => { e.stopPropagation(); toggleRow(user.id); }}>
                        <button className="flex items-center justify-center">
                          {isSelected ? <CheckSquare2 size={16} className="text-violet-600" /> : <Square size={16} className="text-muted-foreground" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        #{user.id}
                      </TableCell>
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
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${srcColor}`}
                          title={user.signupSource || "Direct signup"}
                        >
                          <Globe size={10} />
                          {src}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={12} />{formatLastActive(user.lastActiveAt, user.status, user.createdAt)}</span>
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
        <Pagination
          page={page} totalPages={totalPages} total={total} pageSize={pageSize}
          onPageChange={setPage} onPageSizeChange={changePageSize}
          label="users"
        />
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

      {/* Send Bulk Notification Dialog */}
      <Dialog open={notificationDialog} onOpenChange={setNotificationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Bulk Notification</DialogTitle>
            <DialogDescription>
              Broadcast a push notification campaign to the {selectedIds.size} selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Notification Title *</Label>
              <Input
                placeholder="System Alert"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message Body *</Label>
              <Input
                placeholder="We have updated our terms of service..."
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Action URL (Optional)</Label>
              <Input
                placeholder="/settings/billing"
                value={notificationUrl}
                onChange={(e) => setNotificationUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkNotification} disabled={sendingNotification}>
              {sendingNotification && <Loader2 size={14} className="mr-2 animate-spin" />}
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cross-SaaS User Deep-Dive Drawer */}
      <UserDeepDive user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
