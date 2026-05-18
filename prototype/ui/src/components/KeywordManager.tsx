import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Keyword } from "./KeywordSelector";

interface Props {
  keywords: Keyword[];
  onChange: () => void; // parent refetches list
}

export function KeywordManager({ keywords, onChange }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [geo, setGeo] = useState("Netherlands");
  const [brand, setBrand] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    if (!query.trim() || !geo.trim() || !brand.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), geo: geo.trim(), brand: brand.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: unknown };
        throw new Error(JSON.stringify(body.error ?? "request failed"));
      }
      setQuery("");
      setBrand("");
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      onChange();
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("keyword.title")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("keyword.hint")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-mono font-medium">{kw.query}</p>
                <p className="text-xs text-muted-foreground">
                  {kw.geo} • {kw.brand}
                </p>
              </div>
              <Button
                onClick={() => void remove(kw.id)}
                disabled={deletingId === kw.id || keywords.length <= 1}
                variant="ghost"
                size="icon"
                aria-label={t("keyword.delete")}
                title={keywords.length <= 1 ? t("keyword.cannotDeleteLast") : t("keyword.delete")}
              >
                {deletingId === kw.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--thief))]" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("keyword.addNew")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="text-xs">
              <span className="block text-muted-foreground">{t("keyword.query")}</span>
              <input
                className={inputClass + " mt-1 w-full"}
                placeholder="starcasino bonus"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="text-xs">
              <span className="block text-muted-foreground">{t("keyword.geo")}</span>
              <input
                className={inputClass + " mt-1 w-full"}
                placeholder="Netherlands"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
              />
            </label>
            <label className="text-xs">
              <span className="block text-muted-foreground">{t("keyword.brand")}</span>
              <input
                className={inputClass + " mt-1 w-full"}
                placeholder="starcasino.nl"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </label>
          </div>
          <Button onClick={() => void add()} disabled={busy} size="sm">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {t("keyword.add")}
          </Button>
          {error && (
            <p className="text-xs text-[hsl(var(--thief))]">
              {t("keyword.error")}: <span className="font-mono">{error}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
