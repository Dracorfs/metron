'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResult(null);

    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Import failed');
        return;
      }

      const data = await response.json();
      setResult(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Import Race Data</h1>
        <p className="mt-2 text-slate-600">
          Import race results from a CSV file to begin tracking ratings
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-4 text-sm font-medium text-slate-900">
          Drop your CSV file here or click to select
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Format: race metadata on first line, followed by runner and result rows
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="mt-4 block w-full cursor-pointer"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-slate-600">Processing import...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-medium">Import Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {success && result && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-green-800 font-medium">Import Successful!</p>
          <div className="mt-3 text-sm text-green-700 space-y-1">
            <p>• Runners created: {result.runnersCreated}</p>
            <p>• Race created: {result.raceCreated ? 'Yes' : 'No'}</p>
            <p>• Results created: {result.resultsCreated}</p>
            <p>• Ratings processed: {result.ratingsProcessed}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">CSV Format</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-2">Line 1: Race metadata</p>
            <code className="block bg-slate-100 p-3 rounded overflow-x-auto text-xs">
              race_name,date,location,distance_km,total_participants
            </code>
            <p className="text-slate-600 mt-1">
              Example: Boston Marathon,2024-04-15,Boston MA,42.195,30000
            </p>
          </div>

          <div>
            <p className="font-medium mb-2">Lines 2+: Results</p>
            <code className="block bg-slate-100 p-3 rounded overflow-x-auto text-xs">
              runner_name,position_general,net_time_seconds,position_category,position_sex,category,official_time_seconds
            </code>
            <p className="text-slate-600 mt-1">
              Example: John Smith,42,1425s,12,8,M40-49,1427s
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-medium text-blue-900">Required Fields</p>
            <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc space-y-1">
              <li>runner_name</li>
              <li>position_general</li>
              <li>net_time_seconds</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <p className="font-medium text-slate-900">Optional Fields</p>
            <ul className="text-sm text-slate-600 mt-2 ml-4 list-disc space-y-1">
              <li>position_category</li>
              <li>position_sex</li>
              <li>category</li>
              <li>official_time_seconds</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="font-medium text-amber-900">Note</p>
        <p className="text-sm text-amber-800 mt-1">
          Ensure runner names are consistent across races for proper rating tracking.
          If your CSV includes a runner_metadata section with sex and birth_year,
          include those details on a separate row with columns:
          runner_name,sex,birth_year
        </p>
      </div>
    </div>
  );
}
