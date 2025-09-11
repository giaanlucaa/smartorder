import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { verifyPassword } from "@smartorder/auth";
import { createSession } from "@smartorder/auth/session";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Find user with their venue roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // For now, use the first venue role (in a real app, you might want to let users choose)
    const primaryRole = user.roles[0];
    if (!primaryRole) {
      return NextResponse.json({ error: "No venue access found" }, { status: 403 });
    }

    // Create session
    await createSession({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        venueId: primaryRole.venueId,
        role: primaryRole.role as any,
      },
      venueId: primaryRole.venueId,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      venue: {
        id: primaryRole.venue.id,
        name: primaryRole.venue.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
