import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../packages/db/src/index";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  const venueId = req.nextUrl.searchParams.get("venue");
  if (!venueId) return NextResponse.json({ error: "venue missing" }, { status: 400 });

  try {
    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const categories = await prisma.menuCategory.findMany({
      where: { venueId },
      orderBy: { position: "asc" },
      include: { items: { where: { isActive: true } } },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}
