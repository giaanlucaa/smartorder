import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    // Build-Zeit/Fallback: kein DB-Zugriff
    return NextResponse.json({ 
      allTables: [], 
      tisch1: null 
    }, { status: 200 });
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
