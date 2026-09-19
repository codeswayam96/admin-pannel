'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Tag, Calendar, FileText, Loader2, X, Globe, Lock, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { fetchChangelogs, createChangelog, updateChangelog, deleteChangelog } from '@/lib/api';

interface ChangelogEntry {
  id: number;
  title: string;
  body: string;
  version?: string;
  tags: string[];
  visibility: 'public' | 'internal';
  publishedAt: string | null;
  createdAt: string;
}

const TAG_COLORS: Record<string, string> = {
  feature:     'bg-violet-100 text-violet-700',
  improvement: 'bg-blue-100 text-blue-700',
  bugfix:      'bg-red-100 text-red-700',
  security:    'bg-amber-100 text-amber-700',
  breaking:    'bg-rose-100 text-rose-700',
  performance: 'bg-emerald-100 text-emerald-700',
};

const AVAILABLE_TAGS = Object.keys(TAG_COLORS);

const DEMO_ENTRIES: ChangelogEntry[] = [
  { id: 1, title: 'Org Chart & Workforce Intelligence Dashboard', body: '## What\'s New\n\n- **Org Chart** — Visual hierarchy with role-colored cards, expand/collapse, and employee profile drawer\n- **Workforce Intelligence** — Real-time attrition rate, avg tenure, dept headcount, leave utilization charts\n- **Performance Reviews** — OKR-based review cycles with star ratings and progress tracking', version: 'v2.4.0', tags: ['feature'], visibility: 'public', publishedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 2, title: 'EMS Payroll Module with Pro-Rata Calculation', body: '## Payroll\n\nFull payroll processing engine with:\n- Pro-rata salary based on attendance\n- PF/TDS deductions\n- CSV export and payslip slide-over\n- Salary configuration per employee', version: 'v2.3.0', tags: ['feature', 'improvement'], visibility: 'public', publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 3, title: 'Admin Panel Bulk User Operations', body: 'Multi-select users and perform batch operations: activate, suspend, export CSV. Includes animated bulk toolbar.', version: 'v2.3.1', tags: ['improvement'], visibility: 'public', publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 4, title: 'Neural-Web Agent Detail Page', body: 'Internal release of agent detail page with per-agent metrics, guardrail stats, and configuration panel.', version: 'v2.2.0', tags: ['feature'], visibility: 'internal', publishedAt: null, createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
];

function EntryEditor({ entry, onSave, onClose }: {
  entry?: Partial<ChangelogEntry>; onSave: (data: Partial<ChangelogEntry>) => Promise<void>; onClose: () => void;
}) {
  const [title, setTitle] = useState(entry?.title || '');
  const [body, setBody] = useState(entry?.body || '');
  const [version, setVersion] = useState(entry?.version || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [visibility, setVisibility] = useState<'public' | 'internal'>(entry?.visibility || 'public');
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    await onSave({ title: title.trim(), body, version, tags, visibility });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-bold text-lg">{entry?.id ? 'Edit Changelog Entry' : 'New Changelog Entry'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Dashboard Analytics" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Version</label>
              <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. v2.4.0" className="h-11" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Visibility</label>
              <div className="flex gap-2 h-11">
                {(['public', 'internal'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={cn('flex-1 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
                      visibility === v ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-secondary'
                    )}
                  >
                    {v === 'public' ? <Globe size={13} /> : <Lock size={13} />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold border-2 transition-all capitalize',
                    tags.includes(tag)
                      ? cn(TAG_COLORS[tag], 'border-current')
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Release Notes (Markdown)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="## What's New&#10;&#10;- Feature A&#10;- Improvement B&#10;- Fixed bug C"
              rows={10}
              className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {entry?.id ? 'Save Changes' : 'Publish Entry'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ChangelogEntry> | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [tagFilter, setTagFilter] = useState('all');

  const loadChangelogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchChangelogs();
      setEntries(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load changelog entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChangelogs();
  }, [loadChangelogs]);

  const handleSave = async (data: Partial<ChangelogEntry>) => {
    try {
      if (editing?.id) {
        const updated = await updateChangelog(editing.id, data);
        setEntries(prev => prev.map(e => e.id === editing.id ? updated : e));
        toast.success('Changelog updated');
      } else {
        const created = await createChangelog(data);
        setEntries(prev => [created, ...prev]);
        toast.success('Changelog entry published!');
      }
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changelog entry');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteChangelog(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete changelog entry');
    }
  };

  const handleToggleVisibility = async (id: number) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const nextVisibility = entry.visibility === 'public' ? 'internal' : 'public';
    try {
      const updated = await updateChangelog(id, { visibility: nextVisibility });
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
      toast.success(`Entry set to ${nextVisibility}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle visibility');
    }
  };

  const filtered = entries.filter(e => {
    const matchVis = filter === 'all' || e.visibility === filter;
    const matchTag = tagFilter === 'all' || e.tags.includes(tagFilter);
    return matchVis && matchTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Changelog Manager</h1>
          <p className="text-muted-foreground mt-1">Publish release notes visible to users across all SaaS apps</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus size={15} /> New Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: entries.length, icon: FileText, color: 'bg-violet-100 text-violet-600' },
          { label: 'Public', value: entries.filter(e => e.visibility === 'public').length, icon: Globe, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Internal', value: entries.filter(e => e.visibility === 'internal').length, icon: Lock, color: 'bg-amber-100 text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl border border-border">
          {(['all', 'public', 'internal'] as const).map(v => (
            <button key={v} onClick={() => setFilter(v)} className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
              filter === v ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
            )}>{v}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-xl border border-border overflow-x-auto">
          <button onClick={() => setTagFilter('all')} className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap', tagFilter === 'all' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground')}>All Tags</button>
          {AVAILABLE_TAGS.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tag)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap', tagFilter === tag ? cn(TAG_COLORS[tag]) : 'text-muted-foreground hover:text-foreground')}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(entry => (
            <Card key={entry.id} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <h3 className="font-bold text-base">{entry.title}</h3>
                      {entry.version && (
                        <code className="text-xs font-mono bg-secondary border border-border px-2 py-0.5 rounded-full">{entry.version}</code>
                      )}
                      {entry.visibility === 'public' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Globe size={9} /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Lock size={9} /> Internal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {entry.tags.map(tag => (
                        <span key={tag} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', TAG_COLORS[tag] || 'bg-gray-100 text-gray-700')}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {entry.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{entry.body.replace(/[#*`]/g, '').trim()}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(entry.createdAt).toLocaleDateString()}</span>
                      {entry.publishedAt && (
                        <span className="flex items-center gap-1 text-emerald-600"><Eye size={11} /> Published {new Date(entry.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggleVisibility(entry.id)} title={entry.visibility === 'public' ? 'Make internal' : 'Publish'} className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                      {entry.visibility === 'public' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => setEditing(entry)} className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 rounded-lg border border-red-200 hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <FileText size={40} className="opacity-20" />
              <p className="font-semibold">No changelog entries found</p>
            </div>
          )}
        </div>
      )}

      {editing !== null && (
        <EntryEditor entry={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
