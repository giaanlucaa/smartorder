import { notFound } from 'next/navigation';
import { prisma } from '@smartorder/db';
// import { verifyTableLink } from '@smartorder/auth';

interface LayoutProps {
  children: React.ReactNode;
  params: {
    venueId: string;
    tableToken: string;
  };
}

export default async function TableLayout({ 
  children, 
  params
}: LayoutProps) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const { venueId, tableToken } = params;

    // Note: JWT signature verification is handled in the page component

    // Verify table exists and belongs to venue
    const table = await prisma.table.findFirst({
      where: {
        venueId,
        qrToken: tableToken,
      },
      include: {
        venue: true,
        area: true,
      },
    });

    if (!table) {
      notFound();
    }

    return (
      <div className="min-h-screen" style={{ ['--brand' as any]: table.venue.themeColor || '#111827' }}>
        {children}
      </div>
    );
  } catch (error) {
    console.error('Table layout error:', error);
    notFound();
  }
}
