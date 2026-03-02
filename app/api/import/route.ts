import { NextRequest, NextResponse } from 'next/server';
import { importRaceFromCSV, parseCSV } from '@/lib/csv-import';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.trim().split('\n');

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least race metadata and one result row' },
        { status: 400 }
      );
    }

    // Parse headers from first line
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Parse race metadata
    const raceData = lines[1].split(',').map((v) => v.trim());
    const raceMetadata = parseRaceMetadata(raceData, headers);

    // Parse results
    const resultLines = lines.slice(2);
    const results = parseResults(resultLines, headers);

    // Parse or initialize runners
    const runners = parseRunners(resultLines, headers);

    const result = await importRaceFromCSV(runners, raceMetadata, results);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}

function parseRaceMetadata(
  data: string[],
  headers: string[]
) {
  const nameIdx = headers.indexOf('race_name');
  const dateIdx = headers.indexOf('date');
  const locationIdx = headers.indexOf('location');
  const distanceIdx = headers.indexOf('distance_km');
  const totalIdx = headers.indexOf('total_participants');

  if (nameIdx === -1 || dateIdx === -1 || distanceIdx === -1 || totalIdx === -1) {
    throw new Error('Missing required race metadata columns');
  }

  return {
    race_name: data[nameIdx],
    date: data[dateIdx],
    location: data[locationIdx] || undefined,
    distance_km: parseFloat(data[distanceIdx]),
    total_participants: parseInt(data[totalIdx]),
  };
}

function parseResults(lines: string[], headers: string[]) {
  const nameIdx = headers.indexOf('runner_name');
  const posIdx = headers.indexOf('position_general');
  const timeIdx = headers.indexOf('net_time_seconds');
  const posCatIdx = headers.indexOf('position_category');
  const posSexIdx = headers.indexOf('position_sex');
  const catIdx = headers.indexOf('category');
  const offTimeIdx = headers.indexOf('official_time_seconds');

  if (nameIdx === -1 || posIdx === -1 || timeIdx === -1) {
    throw new Error('Missing required result columns');
  }

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const data = line.split(',').map((v) => v.trim());
      return {
        runner_name: data[nameIdx],
        position_general: parseInt(data[posIdx]),
        net_time_seconds: parseFloat(data[timeIdx]),
        position_category: posCatIdx !== -1 ? parseInt(data[posCatIdx] || '0') || undefined : undefined,
        position_sex: posSexIdx !== -1 ? parseInt(data[posSexIdx] || '0') || undefined : undefined,
        category: catIdx !== -1 ? data[catIdx] : undefined,
        official_time_seconds:
          offTimeIdx !== -1 ? parseFloat(data[offTimeIdx] || '0') || undefined : undefined,
      };
    });
}

function parseRunners(lines: string[], headers: string[]) {
  const nameIdx = headers.indexOf('runner_name');
  const sexIdx = headers.indexOf('sex');
  const birthYearIdx = headers.indexOf('birth_year');

  if (nameIdx === -1) {
    throw new Error('Missing runner_name column');
  }

  const runners = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const data = line.split(',').map((v) => v.trim());
      return {
        full_name: data[nameIdx],
        sex: sexIdx !== -1 ? data[sexIdx] : undefined,
        birth_year: birthYearIdx !== -1 ? parseInt(data[birthYearIdx]) || undefined : undefined,
      };
    });

  // Deduplicate by full_name
  const seen = new Set<string>();
  return runners.filter((r) => {
    if (seen.has(r.full_name)) return false;
    seen.add(r.full_name);
    return true;
  });
}
