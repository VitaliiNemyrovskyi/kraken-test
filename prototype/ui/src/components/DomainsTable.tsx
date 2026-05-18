import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, ExternalLink, Layers } from "lucide-react";
import type { Category, ResultRow } from "../types";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type GroupBy = "none" | "category" | "redirect" | "confidence";

interface Props {
  results: ResultRow[];
}

interface GroupedSection {
  key: string;
  label: string;
  count: number;
  category?: Category;
  rows: ResultRow[];
}

function getGroupKey(r: ResultRow, mode: GroupBy): string {
  switch (mode) {
    case "category":
      return r.classification.category;
    case "redirect":
      return r.scraped.redirectFinalDomain ?? "—";
    case "confidence":
      if (r.classification.confidence >= 0.85) return "high";
      if (r.classification.confidence >= 0.5) return "medium";
      return "low";
    case "none":
    default:
      return "all";
  }
}

const CONFIDENCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const CATEGORY_ORDER: Record<string, number> = {
  official: 0,
  affiliate: 1,
  competitor_brand_thief: 2,
  unclear: 3,
};

function sortKeys(mode: GroupBy, a: string, b: string): number {
  if (mode === "category") return (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99);
  if (mode === "confidence") return (CONFIDENCE_ORDER[a] ?? 99) - (CONFIDENCE_ORDER[b] ?? 99);
  return a.localeCompare(b);
}

export function DomainsTable({ results }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const groups: GroupedSection[] = useMemo(() => {
    if (groupBy === "none") {
      return [
        {
          key: "all",
          label: "all",
          count: results.length,
          rows: results,
        },
      ];
    }
    const map = new Map<string, ResultRow[]>();
    for (const r of results) {
      const k = getGroupKey(r, groupBy);
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => sortKeys(groupBy, a, b))
      .map(([key, rows]) => {
        let label: string;
        let category: Category | undefined;
        if (groupBy === "category") {
          label = t(`category.${key}`);
          category = key as Category;
        } else if (groupBy === "confidence") {
          label = t(`group.confidence.${key}`);
        } else {
          label = key;
        }
        return { key, label, count: rows.length, category, rows };
      });
  }, [results, groupBy, t]);

  const toggle = (pos: number) => {
    const next = new Set(expanded);
    if (next.has(pos)) next.delete(pos);
    else next.add(pos);
    setExpanded(next);
  };

  const GROUP_OPTIONS: { key: GroupBy; labelKey: string }[] = [
    { key: "none", labelKey: "group.none" },
    { key: "category", labelKey: "group.category" },
    { key: "redirect", labelKey: "group.redirect" },
    { key: "confidence", labelKey: "group.confidence.label" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t("group.label")}:</span>
        <div className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGroupBy(opt.key)}
              className={
                "rounded px-2 py-0.5 transition-colors " +
                (groupBy === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-12">{t("table.col.position")}</TableHead>
            <TableHead>{t("table.col.domain")}</TableHead>
            <TableHead>{t("table.col.category")}</TableHead>
            <TableHead className="w-24 text-right">{t("table.col.confidence")}</TableHead>
            <TableHead>{t("table.col.resolved")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              {groupBy !== "none" && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={6} className="py-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                      {group.category ? (
                        <Badge variant={group.category}>{group.label}</Badge>
                      ) : (
                        <span className="font-mono normal-case tracking-normal text-foreground">
                          {group.label}
                        </span>
                      )}
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{group.count}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {group.rows.map((r) => {
                const isOpen = expanded.has(r.serp.position);
                return (
                  <Fragment key={r.serp.position}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggle(r.serp.position)}
                    >
                      <TableCell>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{r.serp.position}</TableCell>
                      <TableCell>
                        <a
                          href={r.serp.url}
                          target="_blank"
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                          {r.serp.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.classification.category}>
                          {t(`category.${r.classification.category}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.classification.confidence.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {r.scraped.redirectFinalDomain ?? "—"}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="bg-muted/20">
                          <div className="space-y-2 py-2 pl-12">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {t("table.row.title")}
                            </p>
                            <p className="text-sm">{r.serp.title}</p>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {t("table.row.snippet")}
                            </p>
                            <p className="text-sm text-muted-foreground">{r.serp.snippet}</p>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {t("table.row.explanation")}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {r.classification.explanation}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
