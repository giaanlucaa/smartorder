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

    // Get fresh user and venue data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const venue = await prisma.venue.findUnique({
      where: { id: session.venueId },
      select: {
        id: true,
        name: true,
        currency: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user || !venue) {
      return NextResponse.json({ error: "User or venue not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      venue,
      role: session.user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
