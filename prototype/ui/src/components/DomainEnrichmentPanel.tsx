import { useTranslation } from "react-i18next";
import { Building2, Calendar, Globe, TrendingUp, Users } from "lucide-react";
import type { DomainEnrichment } from "../types";

interface Props {
  enrichment: DomainEnrichment | undefined;
  locale: string;
}

function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}

function ageInYears(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const years = (Date.now() - t) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(years);
}

export function DomainEnrichmentPanel({ enrichment, locale }: Props) {
  const { t } = useTranslation();

  if (!enrichment) {
    return (
      <p className="text-xs text-muted-foreground">{t("enrichment.unavailable")}</p>
    );
  }

  const age = ageInYears(enrichment.domainCreated);
  const trafficLabel =
    enrichment.source === "whois" || enrichment.source === "heuristic"
      ? t("enrichment.estimatedLabel")
      : "";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-3 w-3" />
          {t("enrichment.registration")}
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">{t("enrichment.registrar")}</dt>
            <dd className="font-mono">{enrichment.registrar ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">{t("enrichment.registrant")}</dt>
            <dd className="font-mono">{enrichment.registrantOrg ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">{t("enrichment.country")}</dt>
            <dd className="font-mono">{enrichment.registrantCountry ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">
              <Calendar className="inline h-3 w-3" /> {t("enrichment.created")}
            </dt>
            <dd className="font-mono">
              {enrichment.domainCreated ?? "—"}
              {age != null && (
                <span className="ml-1 text-muted-foreground">({t("enrichment.yearsOld", { count: age })})</span>
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">
              <Calendar className="inline h-3 w-3" /> {t("enrichment.expires")}
            </dt>
            <dd className="font-mono">{enrichment.domainExpires ?? "—"}</dd>
          </div>
          {enrichment.nameservers.length > 0 && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">
                <Globe className="inline h-3 w-3" /> {t("enrichment.nameservers")}
              </dt>
              <dd className="break-all font-mono text-[10px] leading-relaxed">
                {enrichment.nameservers.slice(0, 4).join(", ")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {t("enrichment.traffic")}
          {trafficLabel && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
              {trafficLabel}
            </span>
          )}
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted-foreground">
              <Users className="inline h-3 w-3" /> {t("enrichment.monthlyVisitors")}
            </dt>
            <dd className="font-mono">{formatNumber(enrichment.monthlyVisitorsEst, locale)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted-foreground">{t("enrichment.globalRank")}</dt>
            <dd className="font-mono">#{formatNumber(enrichment.trafficRank, locale)}</dd>
          </div>
        </dl>
        <p className="pt-2 text-[10px] text-muted-foreground">
          {t("enrichment.sourceLabel")}:{" "}
          <span className="font-mono">{enrichment.source}</span>
          {enrichment.fetchError && (
            <>
              {" "}· <span className="text-[hsl(var(--thief))]">{enrichment.fetchError}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
