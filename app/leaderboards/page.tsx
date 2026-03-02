'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeagueTierColor } from '@/domain/rating';

export type DistanceType = '5k' | '10k' | 'half_marathon' | 'marathon';

const DISTANCES: Record<DistanceType, { label: string; km: number }> = {
  '5k': { label: '5K', km: 5 },
  '10k': { label: '10K', km: 10 },
  'half_marathon': { label: 'Half Marathon', km: 21.0975 },
  'marathon': { label: 'Marathon', km: 42.195 },
};

export default function Leaderboards() {
  const [selectedDistance, setSelectedDistance] = useState<DistanceType>('5k');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/leaderboard/${DISTANCES[selectedDistance].km}`
        );
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedDistance]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboards</h1>
        <p className="mt-2 text-slate-600">
          Top-rated runners by distance (provisional runners excluded)
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.entries(DISTANCES) as [DistanceType, typeof DISTANCES['5k']][]).map(
          ([distKey, dist]) => (
            <button
              key={distKey}
              onClick={() => setSelectedDistance(distKey)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                selectedDistance === distKey
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {dist.label}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">
            No leaderboard data available yet. Import races to see rankings.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Runner
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Races
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const tier =
                  entry.ratingValue >= 850
                    ? 'Elite Amateur'
                    : entry.ratingValue >= 700
                      ? 'Platinum'
                      : entry.ratingValue >= 550
                        ? 'Gold'
                        : entry.ratingValue >= 400
                          ? 'Silver'
                          : 'Bronze';

                return (
                  <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/runners/${entry.runnerId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {entry.runner.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {Math.round(entry.ratingValue)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getLeagueTierColor(tier as any) }}
                      >
                        {tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{entry.racesCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
