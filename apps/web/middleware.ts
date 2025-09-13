import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  const v = req.cookies.get('adminVenueId')?.value;
  if (v) headers.set('x-venue-id', v);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/api/:path*'],
};
