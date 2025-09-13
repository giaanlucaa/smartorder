import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { venueId } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('adminVenueId', venueId, { httpOnly: true, path: '/' });
  return res;
}
