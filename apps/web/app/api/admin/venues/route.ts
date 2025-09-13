import { NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { getSession } from "@smartorder/auth/session";

export async function GET() {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all venues for the current user
    // For now, we'll get all venues - in a real app you'd filter by user permissions
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
        themeColor: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ venues });
  } catch (error) {
    console.error("Get venues error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
