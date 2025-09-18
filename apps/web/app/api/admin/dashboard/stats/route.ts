import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@smartorder/db';
import { getSession } from '@smartorder/auth/session';

export async function GET(request: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await getSession();
    
    if (!session?.user?.id || !session?.venueId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueId = session.venueId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get active tables (tables with orders today)
    const activeTables = await prisma.table.findMany({
      where: {
        area: {
          venueId: venueId
        },
        orders: {
          some: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }
      },
      select: {
        id: true,
        label: true
      }
    });

    // Get today's orders
    const todaysOrders = await prisma.order.findMany({
      where: {
        venueId: venueId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      select: {
        id: true,
        total: true,
        status: true
      }
    });

    // Calculate today's revenue
    const todaysRevenue = todaysOrders
      .filter(order => order.status === 'PAID' || order.status === 'FULFILLED')
      .reduce((sum, order) => sum + Number(order.total), 0);

    // Get total menu items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        category: {
          venueId: venueId
        }
      },
      select: {
        id: true
      }
    });

    const stats = {
      activeTables: activeTables.length,
      todaysOrders: todaysOrders.length,
      todaysRevenue: todaysRevenue,
      menuItems: menuItems.length
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
