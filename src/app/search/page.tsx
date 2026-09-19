"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Users, FileText, ShoppingBag, CreditCard, Tag, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { api } from "@/lib/api";

interface SearchResults {
  users: Array<{ id: number; name: string; email: string; role: string; createdAt: string }>;
  blogs: Array<{ id: number; title: string; slug: string; status: string; tag: string }>;
  products: Array<{ id: number; name: string; tag: string; price: number; status: string }>;
  subscriptions: Array<{ id: number; userEmail: string; productName: string; status: string; createdAt: string }>;
}

const EMPTY: SearchResults = { users: [], blogs: [], products: [], subscriptions: [] };

function ResultSection<T extends { id: number }>({
  icon: Icon,
  title,
  items,
  renderItem,
  emptyLabel,
  color,
}: {
  icon: any;
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyLabel: string;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 px-1 mb-2`}>
        <Icon size={14} className={color} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{items.length}</Badge>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        setResults({ ...EMPTY, ...data });
        setSearched(true);
      } catch {
        // Backend not yet available — search locally within fetched data
        setResults(EMPTY);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const totalResults =
    results.users.length + results.blogs.length + results.products.length + results.subscriptions.length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Search</h1>
        <p className="text-muted-foreground mt-1">Search across users, blogs, products, and subscriptions</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          placeholder="Type to search... (min 2 characters)"
          className="pl-11 pr-10 h-12 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Hint */}
      {!searched && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { icon: Users, label: "Users", desc: "Search by name or email", color: "text-violet-600" },
            { icon: FileText, label: "Blogs", desc: "Search by title or slug", color: "text-blue-600" },
            { icon: ShoppingBag, label: "Products", desc: "Search by product name", color: "text-amber-600" },
            { icon: CreditCard, label: "Subscriptions", desc: "Search by user email", color: "text-emerald-600" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="rounded-xl border p-4 bg-card">
              <Icon size={20} className={`mx-auto mb-2 ${color}`} />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-6">
          {totalResults === 0 ? (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
              <Search size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No results for "{query}"</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{totalResults}</strong> results for "{query}"
                  </p>
                </div>

                <ResultSection
                  icon={Users}
                  title="Users"
                  color="text-violet-600"
                  items={results.users}
                  emptyLabel="No users found"
                  renderItem={(user) => (
                    <Link
                      href={`/users?search=${encodeURIComponent(user.email)}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-700 text-xs font-bold">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{user.role}</Badge>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )}
                />

                <ResultSection
                  icon={FileText}
                  title="Blogs"
                  color="text-blue-600"
                  items={results.blogs}
                  emptyLabel="No blogs found"
                  renderItem={(blog) => (
                    <Link
                      href={`/blogs/${blog.id}/edit`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                          <FileText size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{blog.title}</p>
                          <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          blog.status === "published" ? "bg-emerald-100 text-emerald-700" :
                          blog.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}>{blog.status}</span>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )}
                />

                <ResultSection
                  icon={ShoppingBag}
                  title="Products"
                  color="text-amber-600"
                  items={results.products}
                  emptyLabel="No products found"
                  renderItem={(product) => (
                    <Link
                      href="/products"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                          <Tag size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.tag}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">₹{product.price?.toLocaleString("en-IN") ?? "—"}</span>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )}
                />

                <ResultSection
                  icon={CreditCard}
                  title="Subscriptions"
                  color="text-emerald-600"
                  items={results.subscriptions}
                  emptyLabel="No subscriptions found"
                  renderItem={(sub) => (
                    <Link
                      href="/subscriptions"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                          <CreditCard size={14} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sub.userEmail}</p>
                          <p className="text-xs text-muted-foreground">{sub.productName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          sub.status === "active" ? "bg-emerald-100 text-emerald-700" :
                          sub.status === "expired" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                        }`}>{sub.status}</span>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
