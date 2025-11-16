import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/pricing", "/onboarding", "/portal", "/mobile", "/auth/login", "/auth/mfa"];
const ALWAYS_ALLOW_PREFIXES = ["/api/auth", "/_next", "/images", "/favicon.ico", "/public"];
const PROTECTED_PREFIXES = [
  "/operations",
  "/manufacturing",
  "/planning",
  "/execution",
  "/super-admin",
  "/notifications",
  "/audit",
  "/data-governance",
  "/change-management",
  "/intelligence",
  "/industries",
  "/hcm",
  "/master-data",
  "/navigation",
  "/procurement",
  "/portal/secure",
];

const SECRET = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

type TokenPayload = {
  sessionId: string;
  userId: string;
  tenantId: string;
  userType: string;
  permissions: string[];
};

function shouldBypass(pathname: string) {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }

  return ALWAYS_ALLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function needsProtection(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function verifyToken(token: string) {
  if (!SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const result = await jwtVerify<TokenPayload>(token, SECRET);
  return result.payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  if (!isApiRoute && !needsProtection(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("oru.session")?.value;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

  if (!token) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  try {
    const payload = await verifyToken(token);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-oru-tenant", payload.tenantId);
    requestHeaders.set("x-oru-user", payload.userId);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(pathname)}&reason=expired`, request.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
