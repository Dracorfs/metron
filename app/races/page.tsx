'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RacesPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const response = await fetch('/api/races');
        const data = await response.json();
        setRaces(data.races || []);
      } catch (error) {
        console.error('Failed to fetch races:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Races</h1>
        <p className="mt-2 text-slate-600">Browse all imported races</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Loading races...</p>
        </div>
      ) : races.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">
            No races imported yet. Start by importing race data.
          </p>
          <Link
            href="/import"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
          >
            Import Race
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {races.map((race) => (
            <Link
              key={race.id}
              href={`/races/${race.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-6 hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{race.name}</h3>
                  <p className="text-sm text-slate-600">
                    {race.location || 'Location TBD'} •{' '}
                    {race.distanceKm} km
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">
                    {new Date(race.date).toLocaleDateString()}
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {race.totalParticipants} runners
                  </div>
                </div>
              </div>
              {race.raceStrengthIndex && (
                <div className="mt-4 text-sm text-slate-600">
                  Race Strength Index: {Math.round(race.raceStrengthIndex)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
