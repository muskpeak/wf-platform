"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ResponsiveModal, useMediaQuery } from "@wf-platform/uikit";
import { cn } from "./cn";

export interface VaultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  showClose?: boolean;
}

export function VaultModal({
  open,
  onOpenChange,
  children,
  title,
  header,
  className,
  contentClassName,
  maxWidth = "460px",
  showClose = false,
}: VaultModalProps) {
  const [mounted, setMounted] = useState(false);
  // 当屏幕小于等于 1200px 时（移动端/平板响应式断点），统一使用底部弹出抽屉 (Bottom Sheet)
  const isMobile = useMediaQuery("(max-width: 1200px)");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 锁住 body 滚动
  useEffect(() => {
    if (open && mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  // 移动端：统一使用 @wf-platform/uikit 的 ResponsiveModal (底部拉出抽屉)
  if (isMobile) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        header={header}
        title={title}
        showClose={showClose}
        mobileBreakpoint="(max-width: 1200px)"
        className={cn("border-gray-100 dark:border-gray-800", className)}
        contentClassName={cn("p-4 pb-8 max-h-[85vh] overflow-y-auto", contentClassName)}
      >
        {children}
      </ResponsiveModal>
    );
  }

  // PC 端：渲染符合 WF 平台风格的居中卡片
  const pcModalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "relative w-full rounded-[28px] border border-gray-100/80 dark:border-gray-800/80 bg-white dark:bg-[#16181F] text-gray-900 dark:text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200",
          className
        )}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 自定义 Header 或默认 Header */}
        {header ? (
          header
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/60">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            {showClose && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* 内部滚动区域 */}
        <div className={cn("p-6 max-h-[82vh] overflow-y-auto custom-scrollbar", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(pcModalContent, document.body);
}
