import { NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test database connection
    const now = await prisma.$queryRaw`SELECT NOW()`;
    
    // Test basic Prisma operations
    const userCount = await prisma.user.count();
    const venueCount = await prisma.venue.count();
    
    return NextResponse.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        now,
        userCount,
        venueCount
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    }, { status: 500 });
  }
}
