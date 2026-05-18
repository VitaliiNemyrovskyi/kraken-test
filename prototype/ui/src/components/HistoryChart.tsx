import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types";
import { CATEGORY_COLORS } from "@/src/lib/utils";

interface Props {
  points: HistoryPoint[];
  locale: string;
}

const CATEGORIES = ["official", "affiliate", "competitor_brand_thief", "unclear"] as const;

export function HistoryChart({ points, locale }: Props) {
  const { t } = useTranslation();

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
    );
  }

  const data = points.map((p) => ({
    t: new Date(p.takenAt).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    official: p.counts.official,
    affiliate: p.counts.affiliate,
    competitor_brand_thief: p.counts.competitor_brand_thief,
    unclear: p.counts.unclear,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            color: "hsl(var(--card-foreground))",
            fontSize: 12,
          }}
        />
        <Legend
          iconType="line"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
        />
        {CATEGORIES.map((cat) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={CATEGORY_COLORS[cat]}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={t(`category.${cat}`)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
