import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metron: Running Ranking System',
  description: 'Competitive, mathematically consistent ranking platform for amateur running events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">
                <a href="/">Metron</a>
              </h1>
              <div className="flex gap-6 text-sm font-medium">
                <a href="/" className="hover:text-blue-600">
                  Dashboard
                </a>
                <a href="/leaderboards" className="hover:text-blue-600">
                  Leaderboards
                </a>
                <a href="/races" className="hover:text-blue-600">
                  Races
                </a>
                <a href="/import" className="hover:text-blue-600">
                  Import
                </a>
              </div>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
