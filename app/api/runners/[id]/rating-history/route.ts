import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const distance = request.nextUrl.searchParams.get('distance');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!distance) {
      return NextResponse.json(
        { error: 'distance parameter required' },
        { status: 400 }
      );
    }

    const runnerId = parseInt(params.id);

    const history = await prisma.ratingHistory.findMany({
      where: {
        runnerId,
        distanceKm: parseFloat(distance),
      },
      include: {
        race: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching rating history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating history' },
      { status: 500 }
    );
  }
}
