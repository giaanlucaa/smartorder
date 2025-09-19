import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../../packages/auth/src/session";
import { generatePresignedUpload } from "@smartorder/upload";

export async function POST(req: NextRequest) {
  try {
    // Require MANAGER or OWNER role for uploads
    const session = await requireRole('MANAGER');
    
    const { fileName, contentType } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType required" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    // Note: We can't check actual file size here since we're just generating presigned URL
    // The S3 bucket should have a policy to limit file size

    const result = await generatePresignedUpload(
      fileName,
      contentType,
      session.venueId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Presign upload error:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
