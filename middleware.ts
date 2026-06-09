import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isSiteUnderDevelopment(): boolean {
  return process.env.SITE_UNDER_DEVELOPMENT === "true";
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isSiteUnderDevelopment()) {
    if (pathname === "/privacidade" || pathname.startsWith("/api/public/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (!pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*", "/privacidade", "/api/public/:path*"],
};
