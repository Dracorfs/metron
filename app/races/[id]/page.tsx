'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RaceDetailPage({ params }: { params: { id: string } }) {
  const [race, setRace] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRaceDetails = async () => {
      try {
        const [raceRes, resultsRes] = await Promise.all([
          fetch(`/api/races/${params.id}`),
          fetch(`/api/races/${params.id}/results`),
        ]);

        if (raceRes.ok) {
          const raceData = await raceRes.json();
          setRace(raceData.race);
        }

        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();
          setResults(resultsData.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch race details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRaceDetails();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-8">Loading race details...</div>;
  }

  if (!race) {
    return <div className="text-center py-8">Race not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/races" className="text-blue-600 hover:text-blue-700">
          ← Back to Races
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{race.name}</h1>
        <p className="text-lg text-slate-600">
          {race.location || 'Location TBD'} • {new Date(race.date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Distance</p>
          <p className="text-2xl font-bold">{race.distanceKm} km</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Total Participants</p>
          <p className="text-2xl font-bold">{race.totalParticipants}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Race Strength Index</p>
          <p className="text-2xl font-bold">
            {race.raceStrengthIndex ? Math.round(race.raceStrengthIndex) : 'TBD'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <p className="text-sm text-slate-600">Results</p>
          <p className="text-2xl font-bold">{results.length}</p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Runner
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Time
                </th>
                {results.some((r) => r.positionSex) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Gender Pos
                  </th>
                )}
                {results.some((r) => r.positionCategory) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Category Pos
                  </th>
                )}
                {results.some((r) => r.category) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Category
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const minutes = Math.floor(result.netTimeSeconds / 60);
                const seconds = Math.round(result.netTimeSeconds % 60);
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return (
                  <tr
                    key={result.id}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      #{result.positionGeneral}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/runners/${result.runnerId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {result.runner.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">{timeStr}</td>
                    {results.some((r) => r.positionSex) && (
                      <td className="px-6 py-4 text-sm">
                        {result.positionSex ? `#${result.positionSex}` : '-'}
                      </td>
                    )}
                    {results.some((r) => r.positionCategory) && (
                      <td className="px-6 py-4 text-sm">
                        {result.positionCategory
                          ? `#${result.positionCategory}`
                          : '-'}
                      </td>
                    )}
                    {results.some((r) => r.category) && (
                      <td className="px-6 py-4 text-sm">
                        {result.category || '-'}
                      </td>
                    )}
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
