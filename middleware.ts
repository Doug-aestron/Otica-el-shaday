import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

function isSiteUnderDevelopment(): boolean {
  return process.env.SITE_UNDER_DEVELOPMENT === "true";
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const pathname = req.nextUrl.pathname;

  if (isSiteUnderDevelopment()) {
    if (pathname === "/privacidade" || pathname.startsWith("/api/public/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/painel") && !req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/painel/:path*", "/privacidade", "/api/public/:path*"],
};
