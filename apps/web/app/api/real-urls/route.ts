import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    // Get all tables with their venues
    const tables = await prisma.table.findMany({
      include: { 
        area: true,
        venue: true 
      },
      orderBy: [
        { venue: { name: 'asc' } },
        { area: { name: 'asc' } },
        { label: 'asc' }
      ]
    });

    const tableUrls = tables.map(table => ({
      id: table.id,
      label: table.label,
      area: table.area.name,
      venue: table.venue.name,
      venueId: table.venueId,
      qrToken: table.qrToken,
      url: `http://localhost:3000/t/${table.venueId}/${table.qrToken}`
    }));

    // Find Tisch 1 specifically
    const tisch1 = tables.find(table => 
      table.label.toLowerCase().includes('tisch 1') || 
      table.label.toLowerCase().includes('t1') ||
      table.label === 'T1'
    );

    return NextResponse.json({
      allTables: tableUrls,
      tisch1: tisch1 ? {
        label: tisch1.label,
        area: tisch1.area.name,
        venue: tisch1.venue.name,
        venueId: tisch1.venueId,
        qrToken: tisch1.qrToken,
        url: `http://localhost:3000/t/${tisch1.venueId}/${tisch1.qrToken}`
      } : null
    });

  } catch (error) {
    console.error('Error getting real URLs:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
