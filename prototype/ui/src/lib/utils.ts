import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Category labels live in i18n locales (locales/{en,uk}.json -> category.*).
// Use the `useTranslation()` hook and t(`category.${key}`) at render time.

export const CATEGORY_COLORS: Record<string, string> = {
  official: "hsl(146, 60%, 55%)",
  affiliate: "hsl(213, 100%, 65%)",
  competitor_brand_thief: "hsl(0, 84%, 65%)",
  unclear: "hsl(217, 11%, 65%)",
};
