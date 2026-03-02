import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    const races = await prisma.race.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({ races });
  } catch (error) {
    console.error('Error fetching races:', error);
    return NextResponse.json(
      { error: 'Failed to fetch races' },
      { status: 500 }
    );
  }
}
