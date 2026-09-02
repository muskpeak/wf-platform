"use client";

import { useTheme } from "next-themes";
import { useLanguage } from "@wf-platform/uikit";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme toggles
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{t("common.welcome.title")}</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">{t("common.welcome.description")}</p>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={toggleTheme}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {t("uikit.theme.switch")} ({theme})
        </button>
        
        <select
          value={currentLanguage.locale}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.locale} value={lang.locale}>
              {lang.language}
            </option>
          ))}
        </select>
      </div>
    </main>
  );
}
