"use client";

import { useState } from "react";
import { Search, MoreVertical, Shield, ShieldAlert, ShieldOff, UserCheck, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type UserRole = "admin" | "editor" | "viewer" | "subscriber";
type UserStatus = "active" | "suspended" | "pending";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  lastActive: string;
  avatar: string;
}

const initialUsers: User[] = [
  { id: 1, name: "Niteesh Kumar", email: "niteesh@codeswayam.com", role: "admin", status: "active", joinDate: "Jan 1, 2025", lastActive: "Just now", avatar: "NK" },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@email.com", role: "editor", status: "active", joinDate: "Feb 14, 2025", lastActive: "2h ago", avatar: "PS" },
  { id: 3, name: "Arjun Mehta", email: "arjun.mehta@email.com", role: "editor", status: "active", joinDate: "Mar 3, 2025", lastActive: "1d ago", avatar: "AM" },
  { id: 4, name: "Sneha Patel", email: "sneha.patel@email.com", role: "viewer", status: "active", joinDate: "Apr 22, 2025", lastActive: "3d ago", avatar: "SP" },
  { id: 5, name: "Rahul Verma", email: "rahul.verma@email.com", role: "subscriber", status: "active", joinDate: "May 8, 2025", lastActive: "1w ago", avatar: "RV" },
  { id: 6, name: "Ananya Singh", email: "ananya.singh@email.com", role: "subscriber", status: "suspended", joinDate: "Jun 19, 2025", lastActive: "2w ago", avatar: "AS" },
  { id: 7, name: "Vikram Nair", email: "vikram.nair@email.com", role: "editor", status: "pending", joinDate: "Mar 11, 2026", lastActive: "Never", avatar: "VN" },
  { id: 8, name: "Kavya Reddy", email: "kavya.reddy@email.com", role: "subscriber", status: "active", joinDate: "Jan 30, 2026", lastActive: "5h ago", avatar: "KR" },
];

const roleConfig: Record<UserRole, { icon: React.ElementType; variant: "default" | "secondary" | "outline" | "info"; color: string }> = {
  admin: { icon: ShieldAlert, variant: "default", color: "text-violet-600" },
  editor: { icon: Shield, variant: "info", color: "text-blue-600" },
  viewer: { icon: UserCheck, variant: "secondary", color: "text-slate-600" },
  subscriber: { icon: ShieldOff, variant: "outline", color: "text-muted-foreground" },
};

const statusConfig: Record<UserStatus, { variant: "success" | "warning" | "secondary" }> = {
  active: { variant: "success" },
  suspended: { variant: "warning" },
  pending: { variant: "secondary" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = users.filter((u) =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === "all" || u.role === roleFilter) &&
    (statusFilter === "all" || u.status === statusFilter)
  );

  const changeRole = (id: number, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    toast.success("User role updated");
  };

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
    toast.success("User status changed");
  };

  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("User removed");
  };

  const counts = { total: users.length, active: users.filter(u => u.status === "active").length, admin: users.filter(u => u.role === "admin").length };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-md">
        {[
          { label: "Total Users", value: counts.total },
          { label: "Active", value: counts.active },
          { label: "Admins", value: counts.admin },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="subscriber">Subscriber</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => {
              const rc = roleConfig[user.role];
              const sc = statusConfig[user.status];
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail size={11} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.variant} className="gap-1 capitalize">
                      <rc.icon size={11} /> {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sc.variant} className="capitalize">{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {user.joinDate}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={15} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                        {(["admin", "editor", "viewer", "subscriber"] as UserRole[]).filter(r => r !== user.role).map(r => (
                          <DropdownMenuItem key={r} onClick={() => changeRole(user.id, r)} className="capitalize">{r}</DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleStatus(user.id)} className={user.status === "active" ? "text-amber-600" : "text-emerald-600"}>
                          {user.status === "active" ? "Suspend User" : "Activate User"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Remove User</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove the user account and all associated data.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteUser(user.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
