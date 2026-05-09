const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const AUTH_URL = process.env.NEXT_PUBLIC_APP_AUTH_URL || "http://localhost:3003";

// Guard: both env URLs must be http/https — prevents SSRF via env misconfiguration
const ALLOWED_URL_PATTERN = /^https?:\/\//;
if (typeof window === "undefined") {
    if (API_URL && !ALLOWED_URL_PATTERN.test(API_URL)) {
        throw new Error(`[Admin] Invalid NEXT_PUBLIC_API_URL: must start with http:// or https://`);
    }
    if (AUTH_URL && !ALLOWED_URL_PATTERN.test(AUTH_URL)) {
        throw new Error(`[Admin] Invalid NEXT_PUBLIC_APP_AUTH_URL: must start with http:// or https://`);
    }
}

export { API_URL, AUTH_URL };

export function getAuthUrl(path: string, currentUrl?: string) {
    if (!currentUrl) return `${AUTH_URL}${path}`;
    // Only pass relative path — never full URL — to prevent open redirect
    let safeRedirect = "/";
    try {
        const url = new URL(currentUrl, typeof window !== "undefined" ? window.location.origin : undefined);
        if (typeof window !== "undefined" && url.origin === window.location.origin) {
            // Sanitize: only allow path/query/hash, strip any protocol or host
            const raw = url.pathname + url.search + url.hash;
            safeRedirect = raw.startsWith("/") ? raw : "/";
        }
    } catch {
        safeRedirect = "/";
    }
    return `${AUTH_URL}${path}?redirect=${encodeURIComponent(safeRedirect)}`;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    // Security: Prevent SSRF — path must be relative, no protocol, no host injection
    if (!path.startsWith("/") || path.includes("://") || path.includes("..")) {
        throw new Error("Security Violation: Invalid API path detected.");
    }

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            // Use replace to prevent back-button loop
            window.location.replace(getAuthUrl("/login", window.location.href));
        }
        return new Promise(() => {});
    }
    if (res.status === 403) {
        throw new Error("You do not have permission to access this resource.");
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
    }
    return res.json();
}

/** Generic API helper — use this in pages that need arbitrary endpoints */
export { apiFetch as api };

// ── Auth ────────────────────────────────────
export async function fetchProfile() {
    return apiFetch("/users/profile");
}

export async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    document.cookie = "Authentication=; path=/; max-age=0; SameSite=Lax";
    window.location.href = getAuthUrl("/login");
}

// ── Admin / Users ───────────────────────────
export async function fetchUsers() {
    return apiFetch("/admin/users");
}

export async function updateUserRole(id: number, role: string) {
    return apiFetch(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
    });
}

export async function updateUserStatus(id: number, status: string) {
    return apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export async function deleteUser(id: number) {
    return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

export async function inviteUser(email: string, role: string = "user") {
    return apiFetch("/admin/users/invite", {
        method: "POST",
        body: JSON.stringify({ email, role }),
    });
}

// ── Dashboard & Analytics ────────────────────
export async function fetchDashboard() {
    return apiFetch("/admin/dashboard");
}

export async function fetchAnalytics(range: string = "30d") {
    return apiFetch(`/admin/analytics?range=${range}`);
}

export async function fetchProductAnalytics() {
    return apiFetch("/admin/product-analytics");
}

export async function fetchActivity(limit: number = 50, type?: string) {
    const qs = type ? `&type=${type}` : '';
    return apiFetch(`/admin/activity?limit=${limit}${qs}`);
}

export async function fetchRevenue(range: string = '12m') {
    return apiFetch(`/admin/revenue?range=${range}`);
}


// ── Categories ───────────────────────────────
export async function fetchCategories() {
    return apiFetch("/admin/categories");
}

export async function createCategory(data: Record<string, unknown>) {
    return apiFetch("/admin/categories", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCategory(id: number, data: Record<string, unknown>) {
    return apiFetch(`/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteCategory(id: number) {
    return apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
}

// ── Comments ─────────────────────────────────
export async function fetchComments() {
    return apiFetch("/admin/comments");
}

export async function updateCommentStatus(id: number, status: string) {
    return apiFetch(`/admin/comments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export async function deleteComment(id: number) {
    return apiFetch(`/admin/comments/${id}`, { method: "DELETE" });
}

// ── Media Assets ─────────────────────────────
export async function fetchMedia() {
    return apiFetch("/admin/media");
}

export async function createMedia(data: Record<string, unknown>) {
    return apiFetch("/admin/media", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteMedia(id: number) {
    return apiFetch(`/admin/media/${id}`, { method: "DELETE" });
}

// ── Subscriptions ─────────────────────────────
export async function fetchSubscriptions() {
    return apiFetch("/admin/subscriptions");
}

export async function fetchBundles() {
    return apiFetch("/admin/bundles");
}

export async function createBundle(data: Record<string, unknown>) {
    return apiFetch("/admin/bundles", { method: "POST", body: JSON.stringify(data) });
}

export async function updateBundle(id: number, data: Record<string, unknown>) {
    return apiFetch(`/admin/bundles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteBundle(id: number) {
    return apiFetch(`/admin/bundles/${id}`, { method: "DELETE" });
}

// ── Blogs ───────────────────────────────────
export async function fetchBlogs() {
    return apiFetch("/blogs");
}

export async function fetchBlog(id: number) {
    return apiFetch(`/blogs/${id}`);
}

export async function createBlog(data: Record<string, unknown>) {
    return apiFetch("/blogs", { method: "POST", body: JSON.stringify(data) });
}

export async function updateBlog(id: number, data: Record<string, unknown>) {
    return apiFetch(`/blogs/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteBlog(id: number) {
    return apiFetch(`/blogs/${id}`, { method: "DELETE" });
}

// ── SaaS Products ───────────────────────────
export async function fetchProducts() {
    return apiFetch("/saas-products");
}

export async function fetchProduct(id: number) {
    return apiFetch(`/saas-products/${id}`);
}

export async function createProduct(data: Record<string, unknown>) {
    return apiFetch("/saas-products", { method: "POST", body: JSON.stringify(data) });
}

export async function updateProduct(id: number, data: Record<string, unknown>) {
    return apiFetch(`/saas-products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteProduct(id: number) {
    return apiFetch(`/saas-products/${id}`, { method: "DELETE" });
}

// ── Auth & Admin Settings ─────────────────────
export async function fetchAuthSettings() {
    return apiFetch("/auth/settings");
}

export async function updateAuthSettings(authType: string) {
    return apiFetch("/admin/settings/auth", {
        method: "PATCH",
        body: JSON.stringify({ authType }),
    });
}

export async function fetchSettings() {
    return apiFetch("/admin/settings");
}

export async function updateSettings(data: Record<string, unknown>) {
    return apiFetch("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

// ── Analytics Config (public, no auth needed) ────────────────────────
export async function fetchAnalyticsConfig(appId: string) {
    const sanitizedAppId = appId.replace(/[^a-zA-Z0-9\-_]/g, "");
    if (!sanitizedAppId) return {};
    return apiFetch(`/admin/analytics/config/${sanitizedAppId}`);
}

export async function fetchAnalyticsSettings() {
    return apiFetch('/admin/analytics/settings');
}

export async function updateAnalyticsSettings(data: {
    apps?: Record<string, { gtmId?: string; gscVerification?: string; label?: string }>;
    ga4IdWeb?: string;
    metaPixelId?: string;
    hotjarId?: string;
    clarityId?: string;
}) {
    return apiFetch('/admin/analytics/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function testSmtp(to: string) {
    return apiFetch("/admin/settings/test-smtp", {
        method: "POST",
        body: JSON.stringify({ to }),
    });
}

export async function changePassword(currentPassword: string, newPassword: string) {
    return apiFetch("/admin/settings/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

// ── Rewards: Coupons & Referrals ─────────────────────
export async function fetchAdminCoupons() {
    return apiFetch("/admin/credits/coupons");
}

export async function createAdminCoupon(data: {
    code: string;
    pointsAwarded: number;
    maxUses?: number;
    isActive?: number;
    expiresAt?: string | null;
}) {
    return apiFetch("/admin/credits/coupons", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateAdminCoupon(id: number, data: Partial<{
    code: string;
    pointsAwarded: number;
    maxUses: number;
    isActive: number;
    expiresAt: string | null;
}>) {
    return apiFetch(`/admin/credits/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteAdminCoupon(id: number) {
    return apiFetch(`/admin/credits/coupons/${id}`, {
        method: "DELETE",
    });
}

export async function fetchAdminReferrals(limit: number = 200) {
    return apiFetch(`/admin/credits/referrals?limit=${limit}`);
}

export async function fetchReferralSettings() {
    return apiFetch("/admin/referrals/settings");
}

export async function updateReferralSettings(data: { referralEnabled?: boolean; referralPointsValue?: number }) {
    return apiFetch("/admin/referrals/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

// ── Approvals ───────────────────────────────────

export async function fetchPendingCancellations() {
    return apiFetch("/admin/approvals/cancellations");
}

export async function approveCancellation(id: number, refund: boolean = false) {
    return apiFetch(`/admin/approvals/cancellations/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ refund }),
    });
}

export async function rejectCancellation(id: number, reason?: string) {
    return apiFetch(`/admin/approvals/cancellations/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
}

export async function fetchPendingDeletions() {
    return apiFetch("/admin/approvals/deletions");
}

export async function approveDeletion(id: number) {
    return apiFetch(`/admin/approvals/deletions/${id}/approve`, {
        method: "POST",
    });
}

export async function rejectDeletion(id: number, reason?: string) {
    return apiFetch(`/admin/approvals/deletions/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
}

// ── Push Notifications ───────────────────────────────────────────────────────

export type NotificationAudience = "all" | "subscribers" | "saas" | "segment";

export interface NotificationCampaign {
    id: number;
    title: string;
    body: string;
    url: string | null;
    icon: string | null;
    audience: NotificationAudience;
    saasId: string | null;
    status: "pending" | "sending" | "sent" | "failed" | "scheduled";
    sentCount: number;
    failedCount: number;
    scheduledAt: string | null;
    sentAt: string | null;
    createdAt: string;
    createdBy: number | null;
}

export interface NotificationStats {
    totalSubscribers: number;
    totalSent: number;
    totalFailed: number;
    recentCampaigns: NotificationCampaign[];
}

export async function sendNotificationCampaign(data: {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    audience: NotificationAudience;
    saasId?: string;
    userIds?: number[];
    scheduledAt?: string;
}): Promise<{ campaignId: number; queued: number }> {
    return apiFetch("/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function fetchNotificationCampaigns(): Promise<NotificationCampaign[]> {
    return apiFetch("/admin/notifications/campaigns");
}

export async function fetchNotificationStats(): Promise<NotificationStats> {
    return apiFetch("/admin/notifications/stats");
}

export async function fetchNotificationSubscribers(): Promise<any[]> {
    return apiFetch("/admin/notifications/subscribers");
}

export async function revokeNotificationSubscription(id: number): Promise<{ success: boolean }> {
    return apiFetch(`/admin/notifications/subscribers/${id}`, { method: "DELETE" });
}

export async function deleteNotificationCampaign(id: number): Promise<{ success: boolean }> {
    return apiFetch(`/admin/notifications/campaigns/${id}`, { method: "DELETE" });
}
