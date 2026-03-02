/**
 * Core domain logic for rating calculations
 * All rating math is isolated here and strictly typed
 */

export type DistanceType = '5k' | '10k' | 'half_marathon' | 'marathon';

export const DISTANCE_KM: Record<DistanceType, number> = {
  '5k': 5,
  '10k': 10,
  'half_marathon': 21.0975,
  'marathon': 42.195,
};

export const INITIAL_RATING = 1000;
export const GLOBAL_AVERAGE_RATING = 1000;
export const ELO_SCALING_FACTOR = 400;

export interface RatingInput {
  runnerId: number;
  raceId: number;
  distanceKm: number;
  actualPercentile: number;
  expectedPercentile: number;
  raceStrengthIndex: number;
  racesCount: number;
}

export interface RatingOutput {
  oldRating: number;
  newRating: number;
  delta: number;
  kFactor: number;
  expectedPercentile: number;
  actualPercentile: number;
}

/**
 * Calculate the K-factor based on races completed at this distance
 * Higher volatility early, stabilizes over time
 */
export function calculateKFactor(racesCount: number): number {
  if (racesCount < 5) return 40;
  if (racesCount < 15) return 30;
  return 20;
}

/**
 * Calculate expected percentile using logistic function
 * Models probabilistic expectation of outperforming the field
 *
 * expected_percentile = 1 / (1 + 10^((race_mean_rating - runner_rating) / 400))
 */
export function calculateExpectedPercentile(
  runnerRating: number,
  raceMeanRating: number
): number {
  const exponent = (raceMeanRating - runnerRating) / ELO_SCALING_FACTOR;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Calculate actual percentile from race position
 * actual_percentile = 1 - (position_general / total_participants)
 * Range: (0, 1)
 */
export function calculateActualPercentile(
  positionGeneral: number,
  totalParticipants: number
): number {
  return 1 - (positionGeneral / totalParticipants);
}

/**
 * Calculate race strength multiplier
 * race_strength_multiplier = race_strength_index / global_average_rating
 */
export function calculateRaceStrengthMultiplier(
  raceStrengthIndex: number
): number {
  if (raceStrengthIndex === 0) return 1;
  return raceStrengthIndex / GLOBAL_AVERAGE_RATING;
}

/**
 * Calculate rating delta using expectation-driven formula
 *
 * delta = K * (actual_percentile - expected_percentile) * race_strength_multiplier
 */
export function calculateRatingDelta(
  kFactor: number,
  actualPercentile: number,
  expectedPercentile: number,
  raceStrengthMultiplier: number
): number {
  return (
    kFactor *
    (actualPercentile - expectedPercentile) *
    raceStrengthMultiplier
  );
}

/**
 * Update rating with constraints
 * - Rating cannot drop below 0
 * - System maintains stable global average
 */
export function updateRating(
  currentRating: number,
  delta: number
): number {
  const newRating = currentRating + delta;
  return Math.max(0, newRating);
}

/**
 * Determine if runner is provisional (less than 5 races at this distance)
 */
export function isProvisional(racesCount: number): boolean {
  return racesCount < 5;
}

/**
 * Calculate race strength index from top 30% of finishers' ratings
 * race_strength_index = average(rating_value of top 30% finishers)
 */
export function calculateRaceStrengthIndex(
  participantRatings: number[]
): number {
  if (participantRatings.length === 0) return GLOBAL_AVERAGE_RATING;

  const topThirtyPercent = Math.ceil(participantRatings.length * 0.3);
  const sortedRatings = [...participantRatings].sort((a, b) => b - a);
  const topRatings = sortedRatings.slice(0, topThirtyPercent);

  const average = topRatings.reduce((a, b) => a + b, 0) / topRatings.length;
  return average;
}

/**
 * Get league tier based on rating
 */
export function getLeagueTier(
  rating: number
): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite Amateur' {
  if (rating >= 850) return 'Elite Amateur';
  if (rating >= 700) return 'Platinum';
  if (rating >= 550) return 'Gold';
  if (rating >= 400) return 'Silver';
  return 'Bronze';
}

/**
 * Format league tier with color
 */
export function getLeagueTierColor(
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite Amateur'
): string {
  const colors: Record<typeof tier, string> = {
    'Bronze': '#CD7F32',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
    'Platinum': '#E5E4E2',
    'Elite Amateur': '#FF1493',
  };
  return colors[tier];
}
