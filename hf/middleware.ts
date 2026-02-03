import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/client",
  "/api/auth",
  "/api/cron",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isPublic = PUBLIC_PATHS.some((path) => url.pathname.startsWith(path));

  if (isPublic || url.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL("/login", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
