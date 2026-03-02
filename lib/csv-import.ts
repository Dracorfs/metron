import prisma from './prisma';
import { processRace } from './race-service';

export interface CSVRunnerRow {
  full_name: string;
  sex?: string;
  birth_year?: number;
}

export interface CSVRaceRow {
  race_name: string;
  date: string; // ISO date string YYYY-MM-DD
  location?: string;
  distance_km: number;
  total_participants: number;
}

export interface CSVResultRow {
  runner_name: string;
  position_general: number;
  position_category?: number;
  position_sex?: number;
  category?: string;
  net_time_seconds: number;
  official_time_seconds?: number;
}

export interface ImportResult {
  runnersCreated: number;
  raceCreated: boolean;
  raceId: number;
  resultsCreated: number;
  ratingsProcessed: number;
}

/**
 * Import race data from CSV format
 * Expects arrays of objects representing rows
 */
export async function importRaceFromCSV(
  runners: CSVRunnerRow[],
  race: CSVRaceRow,
  results: CSVResultRow[]
): Promise<ImportResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Ensure runners exist
    let runnersCreated = 0;
    const runnerMap = new Map<string, number>();

    for (const runner of runners) {
      let dbRunner = await tx.runner.findFirst({
        where: { fullName: runner.full_name },
      });

      if (!dbRunner) {
        dbRunner = await tx.runner.create({
          data: {
            fullName: runner.full_name,
            sex: runner.sex,
            birthYear: runner.birth_year,
          },
        });
        runnersCreated++;
      }

      runnerMap.set(runner.full_name, dbRunner.id);
    }

    // 2. Create race
    const dbRace = await tx.race.create({
      data: {
        name: race.race_name,
        date: new Date(race.date),
        location: race.location,
        distanceKm: race.distance_km,
        totalParticipants: race.total_participants,
      },
    });

    // 3. Create results
    let resultsCreated = 0;
    for (const result of results) {
      const runnerId = runnerMap.get(result.runner_name);
      if (!runnerId) {
        console.warn(`Runner not found: ${result.runner_name}`);
        continue;
      }

      // Calculate age at race if birth_year available
      const runnerData = runners.find((r) => r.full_name === result.runner_name);
      let ageAtRace: number | null = null;
      if (runnerData?.birth_year) {
        ageAtRace = new Date(race.date).getFullYear() - runnerData.birth_year;
      }

      await tx.result.create({
        data: {
          runnerId: runnerId,
          raceId: dbRace.id,
          netTimeSeconds: result.net_time_seconds,
          officialTimeSeconds: result.official_time_seconds,
          positionGeneral: result.position_general,
          positionCategory: result.position_category,
          positionSex: result.position_sex,
          category: result.category,
          ageAtRace: ageAtRace,
        },
      });

      resultsCreated++;
    }

    // 4. Process race (updates ratings and rating history)
    const processResult = await processRace(dbRace.id);

    return {
      runnersCreated,
      raceCreated: true,
      raceId: dbRace.id,
      resultsCreated,
      ratingsProcessed: processResult.processedResults,
    };
  });
}

/**
 * Parse CSV string into objects
 */
export function parseCSV(csvString: string): string[][] {
  const lines = csvString.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    // Simple CSV parsing (assumes no complex quoting)
    const cells = line.split(',').map((cell) => cell.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Convert CSV rows to runner objects
 */
export function parseRunnerRows(
  rows: string[][],
  headers: string[]
): CSVRunnerRow[] {
  const fullNameIdx = headers.indexOf('full_name');
  const sexIdx = headers.indexOf('sex');
  const birthYearIdx = headers.indexOf('birth_year');

  if (fullNameIdx === -1) throw new Error('Missing full_name column');

  return rows.map((row) => ({
    full_name: row[fullNameIdx]!,
    sex: sexIdx !== -1 ? row[sexIdx] : undefined,
    birth_year: birthYearIdx !== -1 ? parseInt(row[birthYearIdx]!) : undefined,
  }));
}

/**
 * Parse race metadata
 */
export function parseRaceRow(row: string[], headers: string[]): CSVRaceRow {
  const nameIdx = headers.indexOf('race_name');
  const dateIdx = headers.indexOf('date');
  const locationIdx = headers.indexOf('location');
  const distanceIdx = headers.indexOf('distance_km');
  const totalIdx = headers.indexOf('total_participants');

  if (nameIdx === -1) throw new Error('Missing race_name column');
  if (dateIdx === -1) throw new Error('Missing date column');
  if (distanceIdx === -1) throw new Error('Missing distance_km column');
  if (totalIdx === -1) throw new Error('Missing total_participants column');

  return {
    race_name: row[nameIdx]!,
    date: row[dateIdx]!,
    location: locationIdx !== -1 ? row[locationIdx] : undefined,
    distance_km: parseFloat(row[distanceIdx]!),
    total_participants: parseInt(row[totalIdx]!),
  };
}

/**
 * Parse result rows
 */
export function parseResultRows(
  rows: string[][],
  headers: string[]
): CSVResultRow[] {
  const nameIdx = headers.indexOf('runner_name');
  const posIdx = headers.indexOf('position_general');
  const posCatIdx = headers.indexOf('position_category');
  const posSexIdx = headers.indexOf('position_sex');
  const catIdx = headers.indexOf('category');
  const timeIdx = headers.indexOf('net_time_seconds');
  const offTimeIdx = headers.indexOf('official_time_seconds');

  if (nameIdx === -1) throw new Error('Missing runner_name column');
  if (posIdx === -1) throw new Error('Missing position_general column');
  if (timeIdx === -1) throw new Error('Missing net_time_seconds column');

  return rows.map((row) => ({
    runner_name: row[nameIdx]!,
    position_general: parseInt(row[posIdx]!),
    position_category: posCatIdx !== -1 ? parseInt(row[posCatIdx]!) : undefined,
    position_sex: posSexIdx !== -1 ? parseInt(row[posSexIdx]!) : undefined,
    category: catIdx !== -1 ? row[catIdx] : undefined,
    net_time_seconds: parseFloat(row[timeIdx]!),
    official_time_seconds:
      offTimeIdx !== -1 ? parseFloat(row[offTimeIdx]!) : undefined,
  }));
}
