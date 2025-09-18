import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { status } = await req.json();
  const orderId = params.id;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const validStatuses = ['OPEN', 'PAID', 'FULFILLED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Try to authenticate for admin access, fall back to public access for checkout
    try {
      const session = await requireAuth();
      
      return await withTenantIsolation(session, async (tenantContext) => {
        // Admin access: verify order belongs to tenant's venue
        const order = await prisma.order.findFirst({
          where: { 
            id: orderId,
            venueId: tenantContext.venueId
          }
        });

        if (!order) {
          return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
        }

        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status },
          include: {
            table: {
              include: {
                area: true
              }
            },
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    allergens: true
                  }
                }
              }
            }
          }
        });

        return NextResponse.json(updatedOrder);
      });
    } catch (authError) {
      // Public access: allow status updates for checkout flow (OPEN -> PAID)
      if (status === 'PAID' || status === 'CANCELLED') {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status },
          include: {
            table: {
              include: {
                area: true
              }
            },
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    allergens: true
                  }
                }
              }
            }
          }
        });

        return NextResponse.json(updatedOrder);
      } else {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const orderId = params.id;

  try {
    // Try to authenticate for admin access, fall back to public access for checkout
    try {
      const session = await requireAuth();
      
      return await withTenantIsolation(session, async (tenantContext) => {
        // Admin access: verify order belongs to tenant's venue
        const order = await prisma.order.findFirst({
          where: { 
            id: orderId,
            venueId: tenantContext.venueId
          },
          include: {
            table: {
              include: {
                area: true
              }
            },
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    allergens: true
                  }
                }
              }
            },
            payments: true
          }
        });

        if (!order) {
          return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
        }

        return NextResponse.json(order);
      });
    } catch (authError) {
      // Public access: allow checkout to fetch order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: {
            include: {
              area: true
            }
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  allergens: true
                }
              }
            }
          },
          payments: true
        }
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(order);
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
