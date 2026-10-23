import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth/session";
import { Role } from "./lib/auth/types";

function getDashboardForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MUNICIPAL_OFFICER":
      return "/officer/dashboard";
    case "CITIZEN":
    default:
      return "/citizen/dashboard";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract session token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/officer/login" ||
    pathname === "/admin/login" ||
    pathname === "/staff/login";
  const isCitizenRoute = pathname.startsWith("/citizen");
  const isOfficerRoute = pathname.startsWith("/officer") && pathname !== "/officer/login";
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isGrievanceNew = pathname.startsWith("/grievances/new");

  // If already authenticated and visiting an auth page, redirect according to role
  if (isAuthPage && session) {
    if (session.role === "MUNICIPAL_OFFICER" && (pathname === "/officer/login" || pathname === "/login" || pathname === "/staff/login")) {
      return NextResponse.redirect(new URL("/officer/dashboard", request.url));
    }
    if (session.role === "ADMIN" && (pathname === "/admin/login" || pathname === "/officer/login" || pathname === "/login" || pathname === "/staff/login")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (session.role === "CITIZEN" && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/citizen/dashboard", request.url));
    }
  }

  // Protected route checking
  if (isCitizenRoute || isOfficerRoute || isAdminRoute || isGrievanceNew) {
    if (!session) {
      // Direct unauthenticated users to the specific portal login
      let targetLogin = "/login";
      if (isOfficerRoute) {
        targetLogin = "/officer/login";
      } else if (isAdminRoute) {
        targetLogin = "/admin/login";
      }
      const loginUrl = new URL(targetLogin, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based gate checks
    if (isAdminRoute && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isOfficerRoute && session.role !== "MUNICIPAL_OFFICER" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isCitizenRoute && session.role !== "CITIZEN" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
