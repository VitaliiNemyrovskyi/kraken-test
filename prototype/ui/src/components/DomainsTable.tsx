import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { ResultRow } from "../types";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface Props {
  results: ResultRow[];
}

export function DomainsTable({ results }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (pos: number) => {
    const next = new Set(expanded);
    if (next.has(pos)) next.delete(pos);
    else next.add(pos);
    setExpanded(next);
  };

  return (
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
        {results.map((r) => {
          const isOpen = expanded.has(r.serp.position);
          return (
            <>
              <TableRow
                key={r.serp.position}
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
                <TableRow key={`${r.serp.position}-detail`} className="hover:bg-transparent">
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
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
