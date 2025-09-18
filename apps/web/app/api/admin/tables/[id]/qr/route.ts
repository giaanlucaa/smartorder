import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { signTableLink } from "@smartorder/auth";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const tableId = params.id;

    // Get table with venue info
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        venueId: session.venueId, // Ensure tenant isolation
      },
      include: {
        venue: true,
        area: true,
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Generate signed QR link
    const signature = signTableLink(table.venueId, table.id, table.qrToken);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/t/${table.venueId}/${table.qrToken}?sig=${signature}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      tableId: table.id,
      tableLabel: table.label,
      areaName: table.area.name,
      venueName: table.venue.name,
      qrUrl,
      qrCodeDataUrl,
      qrToken: table.qrToken,
    });
  } catch (error) {
    console.error("Get QR code error:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
