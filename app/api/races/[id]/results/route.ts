import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raceId = parseInt(params.id);

    const results = await prisma.result.findMany({
      where: { raceId },
      include: {
        runner: true,
        race: true,
      },
      orderBy: { positionGeneral: 'asc' },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching race results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch race results' },
      { status: 500 }
    );
  }
}
