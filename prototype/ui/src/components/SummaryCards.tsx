import { useTranslation } from "react-i18next";
import type { CategoryCounts } from "../types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface Props {
  counts: CategoryCounts;
  percentages: CategoryCounts;
}

export function SummaryCards({ counts, percentages }: Props) {
  const { t } = useTranslation();
  const categories = Object.keys(counts) as (keyof CategoryCounts)[];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {categories.map((cat) => (
        <Card key={cat}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <Badge variant={cat}>{t(`category.${cat}`)}</Badge>
              <p className="mt-2 text-3xl font-bold tracking-tight">{counts[cat]}</p>
            </div>
            <p className="text-xl font-semibold text-muted-foreground">{percentages[cat]}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
