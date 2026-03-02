import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runner = await prisma.runner.findUnique({
      where: { id: parseInt(id) },
      include: {
        ratings: {
          orderBy: { distanceKm: 'asc' },
        },
        results: {
          include: { race: true },
          orderBy: { race: { date: 'desc' } },
          take: 10,
        },
      },
    });

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    return NextResponse.json({ runner });
  } catch (error) {
    console.error('Error fetching runner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch runner' },
      { status: 500 }
    );
  }
}
