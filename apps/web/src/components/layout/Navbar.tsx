"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useLanguage, motion } from "@wf-platform/uikit";
import { useConfig } from "../../providers/ConfigProvider";
import dynamic from "next/dynamic";

const ConnectButton = dynamic(
  () => import("../../components/ConnectButtonClient"),
  { ssr: false }
);
import { Moon, Sun, Globe } from "lucide-react";
import { useEffect, useState } from "react";

const navConfig = [
  { path: "/", title: "Home", id: "home" },
  { path: "/trade", title: "Trade", id: "trade" },
  { path: "/earn", title: "Earn", id: "earn" },
  { path: "/polymarket", title: "Polymarket", id: "polymarket" },
  { path: "/lottery/3d", title: "Lottery (3D)", id: "lottery-3d" },
  { path: "/lottery/world", title: "Lottery (World)", id: "lottery-world" },
];

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const config = useConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-200/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            WF Platform
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            {navConfig.map((nav) => (
              <Link 
                key={nav.path} 
                href={nav.path} 
                className="hover:text-blue-500 transition-colors"
              >
                {nav.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          
          {/* Language Selector */}
          <div className="relative group">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center text-gray-600 dark:text-gray-300">
              <Globe className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-32 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.locale}
                  onClick={() => setLanguage(lang.locale)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 ${currentLanguage.locale === lang.locale ? 'text-blue-500 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {lang.language}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
          >
            {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* Connect Wallet */}
          <div className="ml-2">
            <ConnectButton zeroDevProjectId={config.ZERODEV_PROJECT_ID} />
          </div>
        </div>
      </div>
    </nav>
  );
}
