import prisma from './prisma';
import {
  calculateActualPercentile,
  calculateExpectedPercentile,
  calculateKFactor,
  calculateRaceStrengthIndex,
  calculateRaceStrengthMultiplier,
  calculateRatingDelta,
  isProvisional,
  updateRating,
  INITIAL_RATING,
} from '@/domain/rating';

export interface RaceProcessResult {
  raceId: number;
  raceName: string;
  processedResults: number;
  ratings: Array<{
    runnerId: number;
    distance: number;
    oldRating: number;
    newRating: number;
    delta: number;
  }>;
}

/**
 * Process a race transactionally:
 * 1. Load all participant ratings
 * 2. Compute race strength index
 * 3. Calculate expected and actual percentiles
 * 4. Update ratings
 * 5. Store rating history
 * 6. Update race with strength index
 * 7. Increment races_count
 */
export async function processRace(raceId: number): Promise<RaceProcessResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Load race and results
    const race = await tx.race.findUniqueOrThrow({
      where: { id: raceId },
      include: {
        results: {
          include: { runner: true },
        },
      },
    });

    const results = race.results;
    const distanceKm = race.distanceKm;

    // 2. Load all participant ratings at this distance
    const participantIds = results.map((r) => r.runnerId);
    const participantRatings = await tx.rating.findMany({
      where: {
        runnerId: { in: participantIds },
        distanceKm: distanceKm,
      },
    });

    // Create map for easy lookup
    const ratingMap = new Map(
      participantRatings.map((r) => [r.runnerId, r])
    );

    // For runners without ratings at this distance, initialize
    const currentRatings: number[] = [];
    const runnerRatingMap = new Map<number, typeof participantRatings[0]>();

    for (const result of results) {
      let rating = ratingMap.get(result.runnerId);
      if (!rating) {
        // Initialize new rating for this distance
        rating = await tx.rating.create({
          data: {
            runnerId: result.runnerId,
            distanceKm: distanceKm,
            ratingValue: INITIAL_RATING,
            ratingDeviation: 350,
            racesCount: 0,
            provisional: true,
          },
        });
      }
      currentRatings.push(rating.ratingValue);
      runnerRatingMap.set(result.runnerId, rating);
    }

    // 3. Calculate race strength index from top 30% of finishers
    const raceStrengthIndex = calculateRaceStrengthIndex(currentRatings);

    // 4. Calculate mean rating for expected percentile calculation
    const raceMeanRating = currentRatings.reduce((a, b) => a + b, 0) / currentRatings.length;

    // 5. Process each result and update ratings
    const processedRatings: Array<{
      runnerId: number;
      distance: number;
      oldRating: number;
      newRating: number;
      delta: number;
    }> = [];

    for (const result of results) {
      const currentRating = runnerRatingMap.get(result.runnerId);
      if (!currentRating) continue;

      // Calculate percentiles
      const actualPercentile = calculateActualPercentile(
        result.positionGeneral,
        race.totalParticipants
      );
      const expectedPercentile = calculateExpectedPercentile(
        currentRating.ratingValue,
        raceMeanRating
      );

      // Calculate rating delta
      const kFactor = calculateKFactor(currentRating.racesCount);
      const raceStrengthMultiplier = calculateRaceStrengthMultiplier(raceStrengthIndex);
      const delta = calculateRatingDelta(
        kFactor,
        actualPercentile,
        expectedPercentile,
        raceStrengthMultiplier
      );

      // Update rating value
      const newRatingValue = updateRating(currentRating.ratingValue, delta);

      // Store rating history
      await tx.ratingHistory.create({
        data: {
          runnerId: result.runnerId,
          raceId: raceId,
          distanceKm: distanceKm,
          ratingBefore: currentRating.ratingValue,
          ratingAfter: newRatingValue,
          delta: delta,
          expectedPercentile: expectedPercentile,
          actualPercentile: actualPercentile,
          kFactor: kFactor,
        },
      });

      // Update rating
      const newRacesCount = currentRating.racesCount + 1;
      const newProvisional = isProvisional(newRacesCount);

      await tx.rating.update({
        where: { id: currentRating.id },
        data: {
          ratingValue: newRatingValue,
          racesCount: newRacesCount,
          provisional: newProvisional,
        },
      });

      processedRatings.push({
        runnerId: result.runnerId,
        distance: distanceKm,
        oldRating: currentRating.ratingValue,
        newRating: newRatingValue,
        delta: delta,
      });
    }

    // 6. Update race with strength index
    await tx.race.update({
      where: { id: raceId },
      data: {
        raceStrengthIndex: raceStrengthIndex,
      },
    });

    return {
      raceId: race.id,
      raceName: race.name,
      processedResults: results.length,
      ratings: processedRatings,
    };
  });
}

/**
 * Get runner's distance-specific rating
 */
export async function getRunnerRating(runnerId: number, distanceKm: number) {
  return prisma.rating.findUnique({
    where: {
      runnerId_distanceKm: {
        runnerId,
        distanceKm,
      },
    },
  });
}

/**
 * Get runner's rating history
 */
export async function getRunnerRatingHistory(
  runnerId: number,
  distanceKm: number,
  limit = 20
) {
  return prisma.ratingHistory.findMany({
    where: {
      runnerId,
      distanceKm,
    },
    include: {
      race: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get leaderboard for a specific distance
 * Excludes provisional runners
 */
export async function getLeaderboard(distanceKm: number, limit = 100) {
  return prisma.rating.findMany({
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
}

/**
 * Get all races
 */
export async function getAllRaces(limit = 50) {
  return prisma.race.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/**
 * Get race results with ratings
 */
export async function getRaceResults(raceId: number) {
  return prisma.result.findMany({
    where: { raceId },
    include: {
      runner: true,
      race: true,
    },
    orderBy: { positionGeneral: 'asc' },
  });
}

/**
 * Get runner profile with all ratings
 */
export async function getRunnerProfile(runnerId: number) {
  const runner = await prisma.runner.findUnique({
    where: { id: runnerId },
    include: {
      ratings: true,
      results: {
        include: { race: true },
        orderBy: { race: { date: 'desc' } },
        take: 10,
      },
    },
  });

  return runner;
}
