import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { CategoryPie } from "./components/CategoryPie";
import { SummaryCards } from "./components/SummaryCards";
import { DomainsTable } from "./components/DomainsTable";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import type { Summary, SnapshotResponse } from "./types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function App() {
  const { t, i18n } = useTranslation();
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
          <CardContent className="p-6 text-[hsl(var(--thief))]">
            {t("state.error", { message: error })}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 text-muted-foreground">
        {t("state.loading")}
      </div>
    );
  }

  const locale = i18n.resolvedLanguage === "uk" ? "uk-UA" : "en-US";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("header.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("header.query")} <span className="font-mono">"{summary.query}"</span> •{" "}
            {t("header.geo")} <span className="font-mono">{summary.geo}</span> •{" "}
            {snapshot ? (
              <>
                {t("header.snapshot")}{" "}
                {new Date(snapshot.takenAt).toLocaleString(locale)} • {t("header.source")}{" "}
                <span className="font-mono">{snapshot.source}</span> •{" "}
                {t("header.results", { count: summary.total })}
              </>
            ) : (
              <span>{t("header.no_snapshot")}</span>
            )}
          </p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="mb-8">
        <SummaryCards counts={summary.counts} percentages={summary.percentages} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("distribution.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie counts={summary.counts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("table.title", { count: summary.total })}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("table.hint")}</p>
          </CardHeader>
          <CardContent>
            {snapshot && snapshot.results.length > 0 ? (
              <DomainsTable results={snapshot.results} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="border-t pt-6 text-xs text-muted-foreground">{t("footer")}</footer>
    </div>
  );
}
