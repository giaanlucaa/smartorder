import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: "Test API funktioniert",
    timestamp: new Date().toISOString(),
    url: req.url
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      message: "Test POST funktioniert",
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Invalid JSON",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
