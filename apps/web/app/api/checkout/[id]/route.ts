import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    const checkout = await prisma.checkout.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        table: {
          select: {
            id: true,
            label: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!checkout) {
      return NextResponse.json({ 
        error: "Checkout not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ checkout });

  } catch (error) {
    console.error('Checkout retrieval error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    const { status, orderId, errorMessage, metadata } = await req.json();

    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (orderId) updateData.orderId = orderId;
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (metadata) updateData.metadata = { ...updateData.metadata, ...metadata };
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const checkout = await prisma.checkout.update({
      where: { id: params.id },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        table: {
          select: {
            id: true,
            label: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      checkout 
    });

  } catch (error) {
    console.error('Checkout update error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    await prisma.checkout.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: "Checkout deleted successfully" 
    });

  } catch (error) {
    console.error('Checkout deletion error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
