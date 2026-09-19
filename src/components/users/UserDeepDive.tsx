'use client';

import { useState, useEffect } from 'react';
import {
  X, Mail, Calendar, Clock, Shield, CreditCard, Zap,
  CheckCircle2, XCircle, Activity, Briefcase, Bot,
  TrendingUp, LogIn, AlertCircle, BarChart2, ChevronDown,
} from 'lucide-react';
import { apiFetch } from '@codeswayam/api-client';
import { SkeletonUserRow, Skeleton } from '@codeswayam/ui';
import { cn } from '@/lib/utils';
import { fetchUserEntitlements } from '@/lib/api';

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
  signupSource?: string | null;
}

interface UserActivity {
  // core-api data
  subscriptions: Array<{ productName: string; status: string; billingCycle: string; amount: number; createdAt: string }>;
  creditBalance: number;
  totalSpent: number;
  loginCount: number;
  // EMS data (fetched from EMS API)
  ems?: {
    lastCheckIn: string | null;
    totalTasks: number;
    completedTasks: number;
    role: string;
    team: string | null;
  } | null;
  // NeuralHub data
  neural?: {
    tokensUsedThisMonth: number;
    activeAgents: number;
    workflowRuns: number;
  } | null;
}

interface UserDeepDiveProps {
  user: User | null;
  onClose: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DataRow({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-medium text-foreground', valueClass)}>{value}</span>
    </div>
  );
}

const avatarColors = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

// ─── Entitlements Section ────────────────────────────────────────────────────

const COMMON_APPS = ['auraflow', 'ems', 'neural', 'pdfcraft'];

function EntitlementsSection({ userId }: { userId: number }) {
  const [appId, setAppId] = useState(COMMON_APPS[0]);
  const [customApp, setCustomApp] = useState('');
  const [ent, setEnt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setEnt(null);
    try {
      const res = await fetchUserEntitlements(userId, id.trim());
      setEnt(res);
    } catch {
      setEnt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(appId); }, [userId, appId]);

  const activeApp = customApp.trim() || appId;

  return (
    <Section title="Entitlements" icon={<BarChart2 className="w-3.5 h-3.5" />}>
      {/* App selector */}
      <div className="flex gap-2 mb-3">
        <div className="flex gap-1 flex-wrap">
          {COMMON_APPS.map(a => (
            <button
              key={a}
              onClick={() => { setCustomApp(''); setAppId(a); }}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors',
                appId === a && !customApp ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          className="flex-1 min-w-0 h-6 px-2 text-[11px] border border-input rounded bg-background"
          placeholder="custom appId..."
          value={customApp}
          onChange={e => setCustomApp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(customApp)}
        />
        {customApp && (
          <button
            onClick={() => load(customApp)}
            className="px-2 h-6 text-[10px] font-bold bg-violet-600 text-white rounded"
          >
            Go
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {!loading && !ent && (
        <p className="text-xs text-muted-foreground">No entitlement data for this app</p>
      )}

      {!loading && ent && (
        <div className="space-y-2">
          {/* Tier + subscription */}
          <DataRow
            label="Tier"
            value={
              <span className="capitalize font-bold text-violet-700">
                {ent.tier?.label ?? ent.tier?.name ?? '—'}
                {ent.tier?.aiIncluded && ' · AI ✓'}
              </span>
            }
          />
          {ent.subscription && (
            <>
              <DataRow label="Plan" value={ent.subscription.planType ?? '—'} />
              <DataRow label="Status" value={ent.subscription.status ?? '—'} />
              <DataRow label="Billing" value={ent.subscription.billingCycle ?? '—'} />
            </>
          )}
          <DataRow label="Credits" value={`${(ent.credits?.balance ?? 0).toLocaleString()} pts`} valueClass="text-primary" />

          {/* Usage counters */}
          {ent.usage && Object.keys(ent.usage).length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Usage</p>
              {Object.entries(ent.usage as Record<string, any>).map(([key, c]: [string, any]) => {
                const pct = c.limit === -1 ? 0 : Math.min(c.percentage, 100);
                const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e';
                return (
                  <div key={key} className="mb-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span>{c.limit === -1 ? `${c.used} / ∞` : `${c.used} / ${c.limit}`}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserDeepDive({ user, onClose }: UserDeepDiveProps) {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!user) { setActivity(null); return; }

    setLoadingActivity(true);
    setActivity(null);

    // Fetch core-api user details (subscriptions, credits, login count)
    apiFetch(`/admin/users/${user.id}/details`)
      .then((res: any) => setActivity(res))
      .catch(() => setActivity(null))
      .finally(() => setLoadingActivity(false));
  }, [user?.id]);

  if (!user) return null;

  const avatarColor = avatarColors[user.id % avatarColors.length];
  const initials = getInitials(user.name, user.email);

  const statusColor = user.status === 'active'
    ? 'text-emerald-600'
    : user.status === 'suspended'
      ? 'text-red-600'
      : 'text-muted-foreground';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-border shrink-0">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0', avatarColor)}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user.name || '—'}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 shrink-0" />{user.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted font-medium">{user.role}</span>
              <span className={cn('text-xs font-semibold capitalize flex items-center gap-1', statusColor)}>
                {user.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {user.status || 'active'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Account Info */}
          <Section title="Account" icon={<Shield className="w-3.5 h-3.5" />}>
            <DataRow label="User ID" value={`#${user.id}`} />
            <DataRow
              label="Joined"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            />
            <DataRow
              label="Last Active"
              value={user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
            />
            <DataRow label="Signup Source" value={user.signupSource || 'Direct'} />
          </Section>

          {/* Subscriptions & Credits */}
          <Section title="Billing & Credits" icon={<CreditCard className="w-3.5 h-3.5" />}>
            {loadingActivity ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : activity ? (
              <>
                <DataRow label="Credit Balance" value={`${activity.creditBalance?.toLocaleString() ?? 0} pts`} valueClass="text-primary" />
                <DataRow label="Lifetime Spent" value={`${activity.totalSpent?.toLocaleString() ?? 0} pts`} />
                <DataRow label="Login Count" value={activity.loginCount?.toLocaleString() ?? '—'} />
                {activity.subscriptions?.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Active Subscriptions</p>
                    {activity.subscriptions.map((sub, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{sub.productName}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{sub.billingCycle}</p>
                        </div>
                        <span className={cn('text-[11px] font-semibold', sub.status === 'active' ? 'text-emerald-600' : 'text-amber-600')}>
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No active subscriptions</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Could not load billing data
              </p>
            )}
          </Section>

          {/* EMS Activity */}
          <Section title="EMS Activity" icon={<Briefcase className="w-3.5 h-3.5" />}>
            {loadingActivity ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : activity?.ems ? (
              <>
                <DataRow label="Team" value={activity.ems.team || '—'} />
                <DataRow label="EMS Role" value={activity.ems.role || '—'} />
                <DataRow
                  label="Last Check-in"
                  value={activity.ems.lastCheckIn
                    ? new Date(activity.ems.lastCheckIn).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Never'
                  }
                />
                <DataRow
                  label="Tasks"
                  value={`${activity.ems.completedTasks}/${activity.ems.totalTasks} done`}
                  valueClass={activity.ems.completedTasks === activity.ems.totalTasks && activity.ems.totalTasks > 0 ? 'text-emerald-600' : undefined}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {loadingActivity ? '' : 'Not linked to EMS or no activity found'}
              </p>
            )}
          </Section>

          {/* NeuralHub Activity */}
          <Section title="NeuralHub Usage" icon={<Bot className="w-3.5 h-3.5" />}>
            {loadingActivity ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : activity?.neural ? (
              <>
                <DataRow label="Tokens This Month" value={activity.neural.tokensUsedThisMonth?.toLocaleString() ?? '0'} />
                <DataRow label="Active Agents" value={activity.neural.activeAgents ?? '0'} />
                <DataRow label="Workflow Runs" value={activity.neural.workflowRuns ?? '0'} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {loadingActivity ? '' : 'No NeuralHub usage this month'}
              </p>
            )}
          </Section>

          {/* Entitlements */}
          <EntitlementsSection userId={user.id} />

        </div>

        {/* Footer actions */}
        <div className="border-t border-border p-4 flex gap-2 shrink-0">
          <button
            className="flex-1 h-9 rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
          >
            Close
          </button>
          <a
            href={`mailto:${user.email}`}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" /> Email User
          </a>
        </div>
      </div>
    </>
  );
}
