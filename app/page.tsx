'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/runners/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.runners || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Running Ranking System</h1>
        <p className="mt-2 text-lg text-slate-600">
          Competitive, mathematically consistent ranking for amateur running
        </p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto max-w-md">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search runners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Results</h2>
          <div className="grid gap-3">
            {searchResults.map((runner) => (
              <Link
                key={runner.id}
                href={`/runners/${runner.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md transition"
              >
                <div className="font-semibold text-lg">{runner.fullName}</div>
                {runner.birthYear && (
                  <div className="text-sm text-slate-600">
                    Born: {runner.birthYear}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-lg">Getting Started</h3>
          <p className="mt-2 text-sm text-slate-600">
            Import race data to begin tracking runner ratings.
          </p>
          <Link
            href="/import"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Import Race
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-lg">View Leaderboards</h3>
          <p className="mt-2 text-sm text-slate-600">
            See the top-rated runners by distance.
          </p>
          <Link
            href="/leaderboards"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Leaderboards
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-lg">Browse Races</h3>
          <p className="mt-2 text-sm text-slate-600">
            Explore recent races and their results.
          </p>
          <Link
            href="/races"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Races
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">About the System</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>
            <strong>Distance-specific ratings:</strong> Separate ratings for 5K,
            10K, Half Marathon, and Marathon
          </li>
          <li>
            <strong>Distribution-based model:</strong> Ratings based on
            percentile performance relative to the field
          </li>
          <li>
            <strong>Dynamic K-factor:</strong> Ratings stabilize after 5 races,
            with higher volatility early on
          </li>
          <li>
            <strong>Race strength normalization:</strong> Adjustments account
            for the strength of competition
          </li>
          <li>
            <strong>Provisional status:</strong> Runners need 5 races to appear
            in official leaderboards
          </li>
        </ul>
      </div>
    </div>
  );
}
