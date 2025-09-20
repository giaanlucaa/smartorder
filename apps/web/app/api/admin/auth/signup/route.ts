import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { hashPassword, ROLES } from "@smartorder/auth";
import { createSession } from "@smartorder/auth/session";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  // Set SESSION_SECRET if not already set
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "fallback-session-secret-change-in-production";
  }
  
  // Set JWT_SECRET if not already set
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "fallback-jwt-secret-change-in-production";
  }

  try {
    const { email, password, venueName, ownerName } = await req.json();

    if (!email || !password || !venueName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user, venue, and role in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name: ownerName || email.split('@')[0],
          password: hashedPassword,
        },
      });

      // Create venue with unique slug
      const baseSlug = venueName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Ensure slug is unique by appending a number if needed
      let slug = baseSlug || 'venue';
      let counter = 1;
      let finalSlug = slug;
      
      while (await tx.venue.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      const venue = await tx.venue.create({
        data: {
          name: venueName,
          slug: finalSlug,
          vatRates: { normal: 8.1 },
          currency: "CHF",
        },
      });

      // Create owner role
      await tx.userVenueRole.create({
        data: {
          userId: user.id,
          venueId: venue.id,
          role: ROLES.OWNER,
        },
      });

      return { user, venue };
    });

    // Create session
    await createSession({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        venueId: result.venue.id,
        role: ROLES.OWNER,
      },
      venueId: result.venue.id,
    });

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      venue: {
        id: result.venue.id,
        name: result.venue.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Return more detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
