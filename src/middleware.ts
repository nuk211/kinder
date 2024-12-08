// src/middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If trying to access /parent but not signed in or not parent
  if (url.pathname.startsWith('/parent')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', url));
    }
    if (token.role !== 'PARENT') {
      return NextResponse.redirect(new URL('/login', url));
    }
  }

  // If trying to access /admin but not signed in or not admin
  if (url.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', url));
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/parent/:path*'],
};
