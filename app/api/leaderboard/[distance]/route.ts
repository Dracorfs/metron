import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { distance: string } }) {
  try {
    const distanceKm = parseFloat(params.distance);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    const leaderboard = await prisma.rating.findMany({
      where: {
        distanceKm,
        provisional: false,
      },
      include: {
        runner: true,
      },
      orderBy: {
        ratingValue: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
