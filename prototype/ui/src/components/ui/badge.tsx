import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
        official: "border-transparent bg-[hsl(var(--official)/0.18)] text-[hsl(var(--official))]",
        affiliate: "border-transparent bg-[hsl(var(--affiliate)/0.18)] text-[hsl(var(--affiliate))]",
        competitor_brand_thief: "border-transparent bg-[hsl(var(--thief)/0.18)] text-[hsl(var(--thief))]",
        unclear: "border-transparent bg-[hsl(var(--unclear)/0.18)] text-[hsl(var(--unclear))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
