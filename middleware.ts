import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Escape HTML special chars to prevent XSS in inline HTML responses */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get("Authentication")?.value;
    const authUrl = process.env.NEXT_PUBLIC_APP_AUTH_URL || "http://localhost:3003";
    // Only pass the relative path as redirect — never the full URL — to prevent open redirect
    const currentPath = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = `${authUrl}/login?redirect=${encodeURIComponent(currentPath)}`;
    const safeLoginUrl = escapeHtml(loginUrl);

    if (!token) {
        return NextResponse.redirect(loginUrl);
    }

    // Decode JWT payload to check role (JWT is base64url encoded)
    try {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token");
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(padded));
        const role = payload.role;
        if (role !== "admin" && role !== "superadmin") {
            return new NextResponse(
                `<!DOCTYPE html><html><head><title>Access Denied</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc"><div style="text-align:center"><h1 style="font-size:2rem;color:#1e293b">Access Denied</h1><p style="color:#64748b;margin:1rem 0">You need admin or superadmin privileges to access this panel.</p><a href="${safeLoginUrl}" style="color:#7c3aed;text-decoration:underline">Login with a different account</a></div></body></html>`,
                { status: 403, headers: { "Content-Type": "text/html" } }
            );
        }
    } catch {
        return new NextResponse(
            `<!DOCTYPE html><html><head><title>Not Authenticated</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc"><div style="text-align:center"><h1 style="font-size:2rem;color:#1e293b">Not Authenticated</h1><p style="color:#64748b;margin:1rem 0">You are not authenticated. Please login to continue.</p><a href="${safeLoginUrl}" style="display:inline-block;margin-top:1rem;padding:0.5rem 1rem;background:#7c3aed;color:white;text-decoration:none;border-radius:0.375rem">Login</a></div></body></html>`,
            { status: 401, headers: { "Content-Type": "text/html" } }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Protect all routes except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico|api).*)",
    ],
};
