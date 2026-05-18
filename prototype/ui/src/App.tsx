import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { CategoryPie } from "./components/CategoryPie";
import { SummaryCards } from "./components/SummaryCards";
import { DomainsTable } from "./components/DomainsTable";
import { HistoryChart } from "./components/HistoryChart";
import { HelpSheet } from "./components/HelpSheet";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { SettingsSheet } from "./components/SettingsSheet";
import { KeywordSelector, type Keyword } from "./components/KeywordSelector";
import type { DomainEnrichment, HistoryResponse, Summary, SnapshotResponse } from "./types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const SELECTED_KEY = "kraken_selected_keyword_id";

export function App() {
  const { t, i18n } = useTranslation();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selected, setSelected] = useState<Keyword | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotResponse["snapshot"]>(null);
  const [enrichment, setEnrichment] = useState<Record<string, DomainEnrichment>>({});
  const [history, setHistory] = useState<HistoryResponse["points"]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load keyword list (initial + after changes from Settings)
  const loadKeywords = useCallback(async () => {
    const data = await fetchJSON<{ keywords: Keyword[] }>("/api/keywords");
    setKeywords(data.keywords);
    setSelected((prev) => {
      if (prev && data.keywords.find((k) => k.id === prev.id)) return prev;
      const savedId = Number(localStorage.getItem(SELECTED_KEY));
      const saved = data.keywords.find((k) => k.id === savedId);
      return saved ?? data.keywords[0] ?? null;
    });
  }, []);

  useEffect(() => {
    void loadKeywords().catch((e: Error) => setError(e.message));
  }, [loadKeywords]);

  // Reload summary/snapshot/history whenever selection changes; poll every 10s.
  useEffect(() => {
    if (!selected) return;
    localStorage.setItem(SELECTED_KEY, String(selected.id));
    const qs = `query=${encodeURIComponent(selected.query)}&geo=${encodeURIComponent(selected.geo)}`;
    const load = () =>
      Promise.all([
        fetchJSON<Summary>(`/api/summary?${qs}`),
        fetchJSON<SnapshotResponse>(`/api/latest?${qs}`),
        fetchJSON<HistoryResponse>(`/api/history?${qs}&limit=30`),
      ])
        .then(([s, l, h]) => {
          setSummary(s);
          setSnapshot(l.snapshot);
          setEnrichment(l.enrichment ?? {});
          setHistory(h.points);
        })
        .catch((e: Error) => setError(e.message));
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [selected]);

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

  if (!summary || !selected) {
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{t("header.title")}</h1>
            <KeywordSelector
              keywords={keywords}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
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
        <div className="flex items-center gap-2">
          <HelpSheet />
          <SettingsSheet
            locale={locale}
            keywords={keywords}
            onKeywordsChange={() => void loadKeywords()}
          />
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mb-6">
        <SummaryCards counts={summary.counts} percentages={summary.percentages} />
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <CardTitle>{t("history.title", { count: history.length })}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("history.hint")}</p>
          </CardHeader>
          <CardContent>
            <HistoryChart points={history} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("table.title", { count: summary.total })}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("table.hint")}</p>
        </CardHeader>
        <CardContent>
          {snapshot && snapshot.results.length > 0 ? (
            <DomainsTable
              results={snapshot.results}
              enrichment={enrichment}
              locale={locale}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
          )}
        </CardContent>
      </Card>

      <footer className="border-t pt-6 text-xs text-muted-foreground">{t("footer")}</footer>
    </div>
  );
}
