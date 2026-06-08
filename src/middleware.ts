import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyTokenEdge(token: string): Promise<{ valid: boolean; role?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp || Date.now() >= exp * 1000) return { valid: false };
    return { valid: true, role: payload.role };
  } catch {
    return { valid: false };
  }
}

// Route access map: which roles can access which paths
type Role = "admin" | "manager" | "accounts";

function canAccess(pathname: string, role: string): boolean {
  // admin: full access
  if (role === "admin") return true;

  // manager: inventory, expenses, payroll only
  if (role === "manager") {
    if (pathname === "/" || pathname === "/login") return true;
    if (pathname.startsWith("/inventory") || pathname === "/expenses" || pathname === "/payroll") return true;
    // deny: sales, payments, staff, suppliers, settlements, backup
    return ![ "/sales", "/payments", "/staff", "/suppliers", "/settlements", "/backup" ].some(p => pathname.startsWith(p));
  }

  // accounts: sales, settlements, payments only
  if (role === "accounts") {
    if (pathname === "/" || pathname === "/login") return true;
    if (pathname.startsWith("/sales") || pathname.startsWith("/settlements") || pathname.startsWith("/payments")) return true;
    // deny: inventory, expenses, payroll, staff, suppliers, backup
    return ![ "/inventory", "/expenses", "/payroll", "/staff", "/suppliers", "/backup" ].some(p => pathname.startsWith(p));
  }

  return false;
}

const PUBLIC_ROUTES = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Root "/dashboard" — allow if authenticated (admin only sees dashboard)
  // Unauthenticated users hitting "/" are caught by the auth check below
  if (pathname === "/") {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { valid } = await verifyTokenEdge(token);
    if (!valid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Valid admin/manager/accounts — let them through (dashboard page)
    return NextResponse.next();
  }

  // Check auth
  const token = request.cookies.get("token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { valid, role } = await verifyTokenEdge(token);
  if (!valid || !role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access check
  if (!canAccess(pathname, role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    // Redirect to their allowed page instead of showing 403
    const redirectMap: Record<string, string> = {
      manager: "/inventory-daily",
      accounts: "/sales",
    };
    return NextResponse.redirect(new URL(redirectMap[role] || "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|avatar.png|thumbnail.png|visactor.svg).*)",
  ],
};