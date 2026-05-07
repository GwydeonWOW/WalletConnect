import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const url = new URL(request.nextUrl.pathname, apiUrl);
    url.search = request.nextUrl.search;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: '/api/:path*',
};
