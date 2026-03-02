import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raceId = parseInt(params.id);

    const race = await prisma.race.findUnique({
      where: { id: raceId },
    });

    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 });
    }

    return NextResponse.json({ race });
  } catch (error) {
    console.error('Error fetching race:', error);
    return NextResponse.json(
      { error: 'Failed to fetch race' },
      { status: 500 }
    );
  }
}
