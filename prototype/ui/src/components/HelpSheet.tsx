import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground space-y-2">
        {children}
      </div>
    </section>
  );
}

function CategoryRow({
  color,
  name,
  description,
}: {
  color: string;
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card/40 p-3">
      <div
        className="mt-1 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: `hsl(var(--${color}))` }}
      />
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

export function HelpSheet() {
  const { t } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t("help.open")}>
          <HelpCircle className="h-3.5 w-3.5" />
          {t("help.button")}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("help.title")}</SheetTitle>
          <SheetDescription>{t("help.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <Section title={t("help.intro.title")}>
            <p>{t("help.intro.body")}</p>
          </Section>

          <Section title={t("help.categories.title")}>
            <div className="space-y-2">
              <CategoryRow
                color="official"
                name={t("category.official")}
                description={t("help.categories.official")}
              />
              <CategoryRow
                color="affiliate"
                name={t("category.affiliate")}
                description={t("help.categories.affiliate")}
              />
              <CategoryRow
                color="thief"
                name={t("category.competitor_brand_thief")}
                description={t("help.categories.thief")}
              />
              <CategoryRow
                color="unclear"
                name={t("category.unclear")}
                description={t("help.categories.unclear")}
              />
            </div>
          </Section>

          <Section title={t("help.signals.title")}>
            <p>{t("help.signals.intro")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-card/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("help.signals.serpLayer")}
                </div>
                <p className="mt-1 text-xs">{t("help.signals.serpBody")}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• {t("help.signals.serpItems.0")}</li>
                  <li>• {t("help.signals.serpItems.1")}</li>
                  <li>• {t("help.signals.serpItems.2")}</li>
                  <li>• {t("help.signals.serpItems.3")}</li>
                </ul>
              </div>
              <div className="rounded-md border bg-card/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("help.signals.pageLayer")}
                </div>
                <p className="mt-1 text-xs">{t("help.signals.pageBody")}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• {t("help.signals.pageItems.0")}</li>
                  <li>• {t("help.signals.pageItems.1")}</li>
                  <li>• {t("help.signals.pageItems.2")}</li>
                  <li>• {t("help.signals.pageItems.3")}</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("help.signals.fusion")}
            </p>
          </Section>

          <Section title={t("help.unclear.title")}>
            <p>{t("help.unclear.body1")}</p>
            <p>{t("help.unclear.body2")}</p>
            <div className="rounded-md border border-[hsl(var(--unclear))]/40 bg-[hsl(var(--unclear))]/5 p-3 text-xs">
              <strong>{t("help.unclear.calloutTitle")}:</strong>{" "}
              {t("help.unclear.calloutBody")}
            </div>
          </Section>

          <Section title={t("help.monitoring.title")}>
            <p>{t("help.monitoring.body")}</p>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
