import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireRole } from "@smartorder/auth/session";
import { randomBytes } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    // Require MANAGER or OWNER role for token rotation
    const session = await requireRole('MANAGER');
    const tableId = params.id;

    // Get table to ensure it exists and belongs to venue
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        venueId: session.venueId, // Ensure tenant isolation
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Generate new random token
    const newToken = randomBytes(32).toString('hex');

    // Update table with new token
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { qrToken: newToken },
      include: {
        area: true,
      },
    });

    return NextResponse.json({
      tableId: updatedTable.id,
      tableLabel: updatedTable.label,
      areaName: updatedTable.area.name,
      newQrToken: updatedTable.qrToken,
      message: "QR-Token erfolgreich rotiert. Alte QR-Codes sind nicht mehr gültig.",
    });
  } catch (error) {
    console.error("Rotate token error:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
