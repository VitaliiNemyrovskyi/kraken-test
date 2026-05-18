import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { MonitoringControls } from "./MonitoringControls";
import { KeywordManager } from "./KeywordManager";
import type { Keyword } from "./KeywordSelector";

interface Props {
  locale: string;
  keywords: Keyword[];
  onKeywordsChange: () => void;
}

export function SettingsSheet({ locale, keywords, onKeywordsChange }: Props) {
  const { t } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t("settings.open")}>
          <Settings className="h-3.5 w-3.5" />
          {t("settings.button")}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription>{t("settings.description")}</SheetDescription>
        </SheetHeader>
        <div className="mt-2 space-y-4">
          <KeywordManager keywords={keywords} onChange={onKeywordsChange} />
          <MonitoringControls locale={locale} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
