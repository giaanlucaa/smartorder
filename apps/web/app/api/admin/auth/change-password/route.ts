import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";
import { verifyPassword, hashPassword } from "@smartorder/auth";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    return await withTenantIsolation(session, async (tenantContext) => {
      // Get the current user
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
