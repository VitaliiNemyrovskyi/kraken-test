import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORY_LABELS: Record<string, string> = {
  official: "Official",
  affiliate: "Affiliate",
  competitor_brand_thief: "Brand Thief",
  unclear: "Unclear",
};

export const CATEGORY_COLORS: Record<string, string> = {
  official: "hsl(146, 60%, 55%)",
  affiliate: "hsl(213, 100%, 65%)",
  competitor_brand_thief: "hsl(0, 84%, 65%)",
  unclear: "hsl(217, 11%, 65%)",
};
