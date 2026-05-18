import { useTranslation } from "react-i18next";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

export interface Keyword {
  id: number;
  query: string;
  geo: string;
  brand: string;
}

interface Props {
  keywords: Keyword[];
  selected: Keyword | null;
  onSelect: (kw: Keyword) => void;
}

export function KeywordSelector({ keywords, selected, onSelect }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (keywords.length === 0) {
    return <div className="text-xs text-muted-foreground">{t("keyword.none")}</div>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono">{selected?.query ?? "—"}</span>
        <span className="text-xs text-muted-foreground">/ {selected?.geo}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-72 overflow-y-auto rounded-md border bg-card shadow-lg">
          {keywords.map((kw) => {
            const isActive = selected?.id === kw.id;
            return (
              <button
                key={kw.id}
                type="button"
                onClick={() => {
                  onSelect(kw);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  isActive && "bg-accent/50",
                )}
              >
                <span className="font-mono">{kw.query}</span>
                <span className="text-xs text-muted-foreground">
                  {kw.geo} • {kw.brand}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
