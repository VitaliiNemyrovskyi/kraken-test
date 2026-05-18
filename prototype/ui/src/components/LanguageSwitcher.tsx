import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/src/i18n";

const LABELS: Record<SupportedLanguage, string> = {
  uk: "УКР",
  en: "EN",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage as SupportedLanguage) || "uk";

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border bg-card p-1"
      role="group"
      aria-label="Language switcher"
    >
      <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            current === lng
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {LABELS[lng]}
        </button>
      ))}
    </div>
  );
}
