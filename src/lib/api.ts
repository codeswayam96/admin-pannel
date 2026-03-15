const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const AUTH_URL = process.env.NEXT_PUBLIC_APP_AUTH_URL || "http://localhost:3003";

export { API_URL, AUTH_URL };

export function getAuthUrl(path: string, currentUrl?: string) {
    if (!currentUrl) return `${AUTH_URL}${path}`;
    return `${AUTH_URL}${path}?redirect=${encodeURIComponent(currentUrl)}`;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (res.status === 401) {
        throw new Error("Authentication failed. Please login again.");
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

// ── Auth ────────────────────────────────────
export async function fetchProfile() {
    return apiFetch("/users/profile");
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

export async function fetchDashboard() {
    return apiFetch('/admin/dashboard');
}

export async function fetchAnalytics(range: string = '30d') {
    return apiFetch(`/admin/analytics?range=${range}`);
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

// ── Auth Settings ───────────────────────────
export async function fetchAuthSettings() {
    return apiFetch("/auth/settings");
}

export async function updateAuthSettings(authType: string) {
    return apiFetch("/admin/settings/auth", {
        method: "PATCH",
        body: JSON.stringify({ authType }),
    });
}
