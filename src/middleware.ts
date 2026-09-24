import { withCSWAuth } from "@codeswayam/auth/middleware";
import { NextResponse } from "next/server";

/**
 * Admin Panel — SSO Middleware
 *
 * Two-layer protection:
 *  1. withCSWAuth redirects unauthenticated users to the central SSO login.
 *  2. onRequest hook verifies the JWT role claim — only admin/superadmin
 *     may access the panel. Non-admins get a 403 Access Denied page.
 *
 * The JWT payload is decoded directly in Edge (no network call) — safe because
 * we only use it for UX-level role gating. The backend API enforces RBAC on
 * every actual data request.
 */

/** Escape HTML to prevent XSS in the inline 403/401 response page */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

const authUrl = process.env.NEXT_PUBLIC_APP_AUTH_URL || "http://localhost:3003";

export default withCSWAuth({
    appName:      "Admin Panel",
    ssoUrl:       process.env.NEXT_PUBLIC_APP_AUTH_URL,
    callbackPath: "/auth/callback",
    publicPaths:  ["/api", "/auth/callback"],     // webhook/API and callback routes are open
    onRequest: (req, isAuthenticated) => {
        // Not authenticated — withCSWAuth's own redirect will handle it
        if (!isAuthenticated) return;

        const token = req.cookies.get("Authentication")?.value;
        if (!token) return; // shouldn't happen if isAuthenticated is true

        // ── Role check — decode JWT payload (Edge-safe, no network) ───────────
        try {
            const parts = token.split(".");
            if (parts.length !== 3) throw new Error("Malformed JWT");

            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const padded  = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
            const payload = JSON.parse(atob(padded));
            const role    = payload.role as string | undefined;

            if (role !== "admin" && role !== "superadmin") {
                const loginUrl = escapeHtml(`${authUrl}/login?redirect=${encodeURIComponent(req.url)}`);
                return new NextResponse(
                    `<!DOCTYPE html><html><head><title>Access Denied</title></head>` +
                    `<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc">` +
                    `<div style="text-align:center">` +
                    `<h1 style="font-size:2rem;color:#1e293b">Access Denied</h1>` +
                    `<p style="color:#64748b;margin:1rem 0">You need admin or superadmin privileges to access this panel.</p>` +
                    `<a href="${loginUrl}" style="color:#7c3aed;text-decoration:underline">Login with a different account</a>` +
                    `</div></body></html>`,
                    { status: 403, headers: { "Content-Type": "text/html" } },
                );
            }
        } catch {
            // Malformed / tampered token — deny access
            const loginUrl = escapeHtml(`${authUrl}/login?redirect=${encodeURIComponent(req.url)}`);
            return new NextResponse(
                `<!DOCTYPE html><html><head><title>Not Authenticated</title></head>` +
                `<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc">` +
                `<div style="text-align:center">` +
                `<h1 style="font-size:2rem;color:#1e293b">Not Authenticated</h1>` +
                `<p style="color:#64748b;margin:1rem 0">You are not authenticated. Please login to continue.</p>` +
                `<a href="${loginUrl}" style="display:inline-block;margin-top:1rem;padding:0.5rem 1rem;background:#7c3aed;color:white;text-decoration:none;border-radius:0.375rem">Login</a>` +
                `</div></body></html>`,
                { status: 401, headers: { "Content-Type": "text/html" } },
            );
        }

        // Role OK — continue
        return;
    },
});

export const config = {
    matcher: [
        // Protect all routes except Next.js internals and static assets
        "/((?!_next/static|_next/image|favicon.ico|api).*)",
    ],
};
