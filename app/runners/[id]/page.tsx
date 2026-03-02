'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeagueTier, getLeagueTierColor } from '@/domain/rating';

export type DistanceType = '5k' | '10k' | 'half_marathon' | 'marathon';

const DISTANCE_LABELS: Record<DistanceType, string> = {
  '5k': '5K',
  '10k': '10K',
  'half_marathon': 'Half Marathon',
  'marathon': 'Marathon',
};

export default function RunnerDetailPage({ params }: { params: { id: string } }) {
  const [runner, setRunner] = useState<any>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRunnerData = async () => {
      try {
        const response = await fetch(`/api/runners/${params.id}`);
        const data = await response.json();
        setRunner(data.runner);

        // Set first available distance as default
        if (data.runner?.ratings && data.runner.ratings.length > 0) {
          setSelectedDistance(data.runner.ratings[0].distanceKm);
        }
      } catch (error) {
        console.error('Failed to fetch runner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRunnerData();
  }, [params.id]);

  useEffect(() => {
    if (!selectedDistance) return;

    const fetchRatingHistory = async () => {
      try {
        const response = await fetch(
          `/api/runners/${params.id}/rating-history?distance=${selectedDistance}`
        );
        const data = await response.json();
        setRatingHistory(data.history || []);
      } catch (error) {
        console.error('Failed to fetch rating history:', error);
      }
    };

    fetchRatingHistory();
  }, [params.id, selectedDistance]);

  if (loading) {
    return <div className="text-center py-8">Loading runner data...</div>;
  }

  if (!runner) {
    return <div className="text-center py-8">Runner not found</div>;
  }

  const currentRating = runner.ratings?.find(
    (r: any) => r.distanceKm === selectedDistance
  );
  const tier = currentRating
    ? getLeagueTier(currentRating.ratingValue)
    : 'Bronze';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{runner.fullName}</h1>
        {runner.birthYear && (
          <p className="text-slate-600">
            Born {runner.birthYear}
            {runner.sex && ` • ${runner.sex === 'M' ? 'Male' : 'Female'}`}
          </p>
        )}
      </div>

      {runner.ratings && runner.ratings.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {runner.ratings.map((rating: any) => (
              <button
                key={rating.distanceKm}
                onClick={() => setSelectedDistance(rating.distanceKm)}
                className={`rounded-lg px-4 py-2 font-medium transition ${
                  selectedDistance === rating.distanceKm
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {rating.distanceKm === 5
                  ? '5K'
                  : rating.distanceKm === 10
                    ? '10K'
                    : rating.distanceKm === 21.0975
                      ? 'Half Marathon'
                      : 'Marathon'}
              </button>
            ))}
          </div>

          {currentRating && (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-white p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Rating</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(currentRating.ratingValue)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Tier</p>
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: getLeagueTierColor(tier) }}
                >
                  {tier}
                </span>
              </div>
              <div className="rounded-lg bg-white p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Races (Distance)</p>
                <p className="text-3xl font-bold">
                  {currentRating.racesCount}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Status</p>
                <p className="text-lg font-semibold mt-2">
                  {currentRating.provisional ? (
                    <span className="text-amber-600">Provisional</span>
                  ) : (
                    <span className="text-green-600">Official</span>
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Deviation</p>
                <p className="text-2xl font-bold">
                  ±{Math.round(currentRating.ratingDeviation)}
                </p>
              </div>
            </div>
          )}

          {ratingHistory.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">Rating History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Race
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Before
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        After
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Delta
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Actual/Expected
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        K
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratingHistory.map((entry) => {
                      const isGain = entry.delta > 0;
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium">
                            <Link
                              href={`/races/${entry.raceId}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {entry.race.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            {new Date(entry.race.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {Math.round(entry.ratingBefore)}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {Math.round(entry.ratingAfter)}
                          </td>
                          <td
                            className={`px-4 py-3 font-bold ${
                              isGain
                                ? 'text-green-600'
                                : entry.delta < 0
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                            }`}
                          >
                            {isGain ? '+' : ''}{Math.round(entry.delta * 10) / 10}
                          </td>
                          <td className="px-4 py-3">
                            {Math.round(entry.actualPercentile * 100)}% /{' '}
                            {Math.round(entry.expectedPercentile * 100)}%
                          </td>
                          <td className="px-4 py-3">
                            {Math.round(entry.kFactor)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {runner.results && runner.results.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Races</h2>
          <div className="space-y-3">
            {runner.results.slice(0, 10).map((result: any) => (
              <Link
                key={result.id}
                href={`/races/${result.raceId}`}
                className="block p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{result.race.name}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(result.race.date).toLocaleDateString()} •{' '}
                      {result.race.distanceKm} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      #{result.positionGeneral}
                    </p>
                    {result.ageAtRace && (
                      <p className="text-sm text-slate-600">
                        Age {result.ageAtRace}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
