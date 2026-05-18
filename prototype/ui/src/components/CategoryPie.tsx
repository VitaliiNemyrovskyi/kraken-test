import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { CategoryCounts } from "../types";
import { CATEGORY_COLORS } from "@/src/lib/utils";

interface Props {
  counts: CategoryCounts;
}

export function CategoryPie({ counts }: Props) {
  const { t } = useTranslation();
  const data = (
    Object.keys(counts) as (keyof CategoryCounts)[]
  ).map((key) => ({
    name: t(`category.${key}`),
    key,
    value: counts[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={95}
          paddingAngle={2}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] ?? "#888"} />
          ))}
        </Pie>
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
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
