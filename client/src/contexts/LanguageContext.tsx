import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { Language, getTranslation, TranslationKeys } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * LanguageProvider
 * - Source of truth: URL prefix (/zh/* → Chinese, else English)
 * - setLanguage navigates to the equivalent /zh or English route
 * - Falls back to localStorage only on the root path "/"
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();

  // Derive language from URL
  const urlLanguage: Language = location.startsWith("/zh") ? "zh" : "en";

  // Internal state mirrors URL (needed for React re-renders)
  const [language, setLanguageState] = useState<Language>(urlLanguage);

  // Keep state in sync when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setLanguageState(urlLanguage);
  }, [urlLanguage]);

  /**
   * Switch language by navigating to the equivalent path in the other locale.
   * /swipe → /zh/swipe  (en→zh)
   * /zh/swipe → /swipe  (zh→en)
   */
  const setLanguage = (lang: Language) => {
    if (lang === language) return;

    if (lang === "zh") {
      // Add /zh prefix
      if (location === "/" || location === "/swipe") {
        navigate("/zh/swipe");
      } else if (!location.startsWith("/zh")) {
        navigate(`/zh${location}`);
      }
    } else {
      // Remove /zh prefix
      if (location === "/zh" || location === "/zh/swipe") {
        navigate("/");
      } else if (location.startsWith("/zh")) {
        navigate(location.slice(3) || "/");
      }
    }
  };

  const t = getTranslation(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
