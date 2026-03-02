import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({ runners: [] });
    }

    const runners = await prisma.runner.findMany({
      where: {
        fullName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ runners });
  } catch (error) {
    console.error('Error searching runners:', error);
    return NextResponse.json(
      { error: 'Failed to search runners' },
      { status: 500 }
    );
  }
}
