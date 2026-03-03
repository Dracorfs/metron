import { describe, it, expect } from 'vitest';
import {
  calculateKFactor,
  calculateExpectedPercentile,
  calculateActualPercentile,
  calculateRaceStrengthMultiplier,
  calculateRatingDelta,
  updateRating,
  isProvisional,
  calculateRaceStrengthIndex,
  getLeagueTier,
  GLOBAL_AVERAGE_RATING,
} from './rating';

describe('Rating Calculations', () => {
  describe('calculateKFactor', () => {
    it('should return 40 for less than 5 races', () => {
      expect(calculateKFactor(0)).toBe(40);
      expect(calculateKFactor(4)).toBe(40);
    });

    it('should return 30 for 5-14 races', () => {
      expect(calculateKFactor(5)).toBe(30);
      expect(calculateKFactor(14)).toBe(30);
    });

    it('should return 20 for 15+ races', () => {
      expect(calculateKFactor(15)).toBe(20);
      expect(calculateKFactor(100)).toBe(20);
    });
  });

  describe('calculateExpectedPercentile', () => {
    it('should return 0.5 when runner rating equals race mean', () => {
      const expected = calculateExpectedPercentile(1000, 1000);
      expect(expected).toBeCloseTo(0.5, 2);
    });

    it('should return higher value when runner is stronger', () => {
      const stronger = calculateExpectedPercentile(1200, 1000);
      const weaker = calculateExpectedPercentile(800, 1000);
      expect(stronger).toBeGreaterThan(0.5);
      expect(weaker).toBeLessThan(0.5);
      expect(stronger).toBeGreaterThan(weaker);
    });

    it('should be symmetrical', () => {
      const above = calculateExpectedPercentile(1100, 1000);
      const below = calculateExpectedPercentile(900, 1000);
      expect(above).toBeCloseTo(1 - below, 4);
    });
  });

  describe('calculateActualPercentile', () => {
    it('should calculate percentile correctly', () => {
      // 1st place out of 100
      expect(calculateActualPercentile(1, 100)).toBe(0.99);
      // 50th place out of 100
      expect(calculateActualPercentile(50, 100)).toBe(0.5);
      // 100th place out of 100
      expect(calculateActualPercentile(100, 100)).toBe(0);
    });
  });

  describe('calculateRaceStrengthMultiplier', () => {
    it('should return 1 for zero strength index', () => {
      expect(calculateRaceStrengthMultiplier(0)).toBe(1);
    });

    it('should return correct multiplier', () => {
      expect(calculateRaceStrengthMultiplier(1000)).toBe(1);
      expect(calculateRaceStrengthMultiplier(1200)).toBe(1.2);
      expect(calculateRaceStrengthMultiplier(800)).toBe(0.8);
    });
  });

  describe('calculateRatingDelta', () => {
    it('should increase rating when outperforming expectations', () => {
      const delta = calculateRatingDelta(30, 0.6, 0.4, 1);
      expect(delta).toBeGreaterThan(0);
    });

    it('should decrease rating when underperforming', () => {
      const delta = calculateRatingDelta(30, 0.3, 0.5, 1);
      expect(delta).toBeLessThan(0);
    });

    it('should be zero when matching expectations', () => {
      const delta = calculateRatingDelta(30, 0.5, 0.5, 1);
      expect(delta).toBe(0);
    });
  });

  describe('updateRating', () => {
    it('should add delta to current rating', () => {
      const newRating = updateRating(1000, 25);
      expect(newRating).toBe(1025);
    });

    it('should not go below zero', () => {
      const newRating = updateRating(100, -200);
      expect(newRating).toBe(0);
    });
  });

  describe('isProvisional', () => {
    it('should be provisional when less than 5 races', () => {
      expect(isProvisional(0)).toBe(true);
      expect(isProvisional(4)).toBe(true);
    });

    it('should not be provisional when 5+ races', () => {
      expect(isProvisional(5)).toBe(false);
      expect(isProvisional(100)).toBe(false);
    });
  });

  describe('calculateRaceStrengthIndex', () => {
    it('should return average rating for top 30%', () => {
      const ratings = [1000, 950, 900, 850, 800];
      const index = calculateRaceStrengthIndex(ratings);
      // Top 30% = 2 runners (ceiling of 5 * 0.3 = 1.5)
      // Top 2: 1000, 950
      // Average: 975
      expect(index).toBeCloseTo(975, 0);
    });

    it('should return global average for empty input', () => {
      const index = calculateRaceStrengthIndex([]);
      expect(index).toBe(GLOBAL_AVERAGE_RATING);
    });
  });

  describe('getLeagueTier', () => {
    it('should return correct tier', () => {
      expect(getLeagueTier(100)).toBe('Bronze');
      expect(getLeagueTier(450)).toBe('Silver');
      expect(getLeagueTier(600)).toBe('Gold');
      expect(getLeagueTier(750)).toBe('Platinum');
      expect(getLeagueTier(900)).toBe('Elite Amateur');
    });

    it('should handle boundary values', () => {
      expect(getLeagueTier(399)).toBe('Bronze');
      expect(getLeagueTier(400)).toBe('Silver');
      expect(getLeagueTier(550)).toBe('Gold');
      expect(getLeagueTier(700)).toBe('Platinum');
      expect(getLeagueTier(850)).toBe('Elite Amateur');
    });
  });
});
