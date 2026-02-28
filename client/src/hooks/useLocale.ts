import { useLocation } from "wouter";

export type Locale = "en" | "zh";

/**
 * Detects the current locale from the URL prefix (/zh/* = Chinese, else English).
 * Also provides locale-aware path helpers.
 */
export function useLocale(): {
  locale: Locale;
  isZh: boolean;
  localePath: (path: string) => string;
} {
  const [location] = useLocation();
  const isZh = location.startsWith("/zh");
  const locale: Locale = isZh ? "zh" : "en";

  /**
   * Given an English path like "/swipe", returns the locale-prefixed path.
   * e.g. localePath("/swipe") → "/zh/swipe" when locale is zh
   */
  function localePath(path: string): string {
    if (locale === "zh") {
      return `/zh${path === "/" ? "" : path}`;
    }
    return path;
  }

  return { locale, isZh, localePath };
}
