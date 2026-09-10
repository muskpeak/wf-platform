"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
// @ts-ignore
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function TopLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    setProgress(15);

    // Incrementally crawl to ~85% while waiting for route transition
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        return prev + Math.floor(Math.random() * 10 + 5);
      });
    }, 150);
  };

  const finishLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
  };

  // 1. 点击 A 页面的链接时，在 A 页面【瞬间】启动进度条
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // 排除外链、锚点、新标签页打开等
      if (
        target.target === "_blank" ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      const currentPathWithSearch = window.location.pathname + window.location.search;
      // 只有跳转目标与当前地址不同时才在 A 页面【立刻】启动加载条
      if (href !== currentPathWithSearch && href !== window.location.pathname) {
        startLoading();
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  // 2. 当 Next.js 路由真正完成并切换到 B 页面时，快速冲满 100% 并淡出
  useEffect(() => {
    finishLoading();
  }, [pathname, searchParams]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[120] h-[3px] pointer-events-none">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="h-full relative overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#0088FF] via-[#33A1FF] to-[#0088FF] shadow-[0_0_12px_#0088FF] transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderContent />
    </Suspense>
  );
}
