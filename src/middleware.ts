import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp || Date.now() >= exp * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

const PUBLIC_ROUTES = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check auth for protected routes
  const token = request.cookies.get("token")?.value;
  if (!token || !(await verifyTokenEdge(token))) {
    // Allow API routes to handle auth themselves
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    // Redirect to login for page routes
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|avatar.png|thumbnail.png|visactor.svg).*)",
  ],
};