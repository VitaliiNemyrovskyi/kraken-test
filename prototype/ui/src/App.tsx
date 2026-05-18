import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { CategoryPie } from "./components/CategoryPie";
import { SummaryCards } from "./components/SummaryCards";
import { DomainsTable } from "./components/DomainsTable";
import type { Summary, SnapshotResponse } from "./types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotResponse["snapshot"]>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJSON<Summary>("/api/summary"),
      fetchJSON<SnapshotResponse>("/api/latest"),
    ])
      .then(([s, l]) => {
        setSummary(s);
        setSnapshot(l.snapshot);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Card className="border-[hsl(var(--thief))]">
          <CardContent className="p-6 text-[hsl(var(--thief))]">Error: {error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return <div className="mx-auto max-w-7xl px-6 py-10 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">StarCasino — Branded SERP Monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Query <span className="font-mono">"{summary.query}"</span> • Geo{" "}
          <span className="font-mono">{summary.geo}</span> •{" "}
          {snapshot ? (
            <>
              Snapshot {new Date(snapshot.takenAt).toLocaleString()} • Source{" "}
              <span className="font-mono">{snapshot.source}</span> • {summary.total} results
            </>
          ) : (
            <span>No snapshot — run `npm run analyze:mock`.</span>
          )}
        </p>
      </header>

      <section className="mb-8">
        <SummaryCards counts={summary.counts} percentages={summary.percentages} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie counts={summary.counts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top-{summary.total} domains</CardTitle>
            <p className="text-xs text-muted-foreground">
              Click any row to see the classifier's reasoning.
            </p>
          </CardHeader>
          <CardContent>
            {snapshot && snapshot.results.length > 0 ? (
              <DomainsTable results={snapshot.results} />
            ) : (
              <p className="text-sm text-muted-foreground">No results yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="border-t pt-6 text-xs text-muted-foreground">
        Kraken Leads — Task 2 prototype • React + Vite + Tailwind + shadcn/ui • Recharts •
        Fastify + Playwright + SQLite + OpenRouter (Claude Opus 4.7)
      </footer>
    </div>
  );
}
