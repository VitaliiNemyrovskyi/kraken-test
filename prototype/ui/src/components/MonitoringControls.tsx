import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, RefreshCw, Square, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/src/lib/utils";

interface SchedulerStatus {
  active: boolean;
  cron: string | null;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastRunError: string | null;
  busy: boolean;
}

interface IntervalPreset {
  key: string;
  labelKey: string;
  cron: string;
}

const PRESETS: IntervalPreset[] = [
  { key: "30s", labelKey: "interval.30s", cron: "*/30 * * * * *" },
  { key: "1m", labelKey: "interval.1m", cron: "*/1 * * * *" },
  { key: "5m", labelKey: "interval.5m", cron: "*/5 * * * *" },
  { key: "15m", labelKey: "interval.15m", cron: "*/15 * * * *" },
  { key: "1h", labelKey: "interval.1h", cron: "0 * * * *" },
  { key: "6h", labelKey: "interval.6h", cron: "0 */6 * * *" },
  { key: "daily", labelKey: "interval.daily", cron: "0 0 * * *" },
];

interface Props {
  locale: string;
}

export function MonitoringControls({ locale }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/monitor/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // ignore — keep last state
    }
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const triggerNow = async () => {
    setTriggering(true);
    try {
      await fetch("/api/monitor/trigger", { method: "POST" });
      // Server returns immediately; tick continues async. Refresh shows busy=true.
      await refresh();
    } finally {
      setTimeout(() => setTriggering(false), 800);
    }
  };

  const applyPreset = async (preset: IntervalPreset) => {
    setPendingPreset(preset.key);
    try {
      await fetch("/api/monitor/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cron: preset.cron }),
      });
      await refresh();
    } finally {
      setPendingPreset(null);
    }
  };

  const stop = async () => {
    await fetch("/api/monitor/stop", { method: "POST" });
    await refresh();
  };

  if (!status) return null;

  const activePreset = PRESETS.find((p) => p.cron === status.cron);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("monitor.title")}</CardTitle>
          <Badge variant={status.active ? "official" : "unclear"}>
            {status.active ? t("monitor.active") : t("monitor.stopped")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{t("monitor.hint")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {t("monitor.schedule")}
            </p>
            <p className="mt-1 font-mono">
              {status.cron ?? <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {t("monitor.lastRun")}
            </p>
            <p className="mt-1">
              {status.lastRunAt
                ? new Date(status.lastRunAt).toLocaleString(locale)
                : <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {t("monitor.duration")}
            </p>
            <p className="mt-1 font-mono">
              {status.lastRunDurationMs != null
                ? `${status.lastRunDurationMs}ms`
                : <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {t("monitor.busy")}
            </p>
            <p className="mt-1">
              {status.busy ? (
                <span className="inline-flex items-center gap-1 text-[hsl(var(--affiliate))]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("monitor.running")}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("monitor.idle")}</span>
              )}
            </p>
          </div>
        </div>

        {status.lastRunError && (
          <div className="rounded-md border border-[hsl(var(--thief))]/40 bg-[hsl(var(--thief))]/10 p-3 text-xs text-[hsl(var(--thief))]">
            {t("monitor.lastError")}: <span className="font-mono">{status.lastRunError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={triggerNow}
            disabled={status.busy || triggering}
            size="sm"
            variant="default"
          >
            {status.busy || triggering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t("monitor.runNow")}
          </Button>
          {status.active && (
            <Button onClick={stop} size="sm" variant="outline">
              <Square className="h-3.5 w-3.5" />
              {t("monitor.stop")}
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("monitor.intervalLabel")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const isActive = activePreset?.key === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => void applyPreset(preset)}
                  disabled={pendingPreset !== null}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    pendingPreset === preset.key && "opacity-50",
                  )}
                >
                  {pendingPreset === preset.key && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {!isActive && pendingPreset !== preset.key && (
                    <Play className="h-3 w-3" />
                  )}
                  {t(preset.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
