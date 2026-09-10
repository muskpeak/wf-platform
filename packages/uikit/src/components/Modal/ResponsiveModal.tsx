"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@wf-platform/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showClose?: boolean;
  /** Breakpoint below which to display as a Bottom Sheet. Default 1023px (lg) */
  mobileBreakpoint?: string;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  header,
  className,
  contentClassName,
  showClose = true,
  mobileBreakpoint = "(max-width: 1023px)",
}: ResponsiveModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const isMobile = useMediaQuery(mobileBreakpoint);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isMobile) return null;

  const renderHeader = () => {
    if (header) return header;
    if (title || showClose) {
      return (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="flex flex-col">
            {title && (
              <h2 className="text-base font-bold leading-none tracking-tight text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {showClose && (
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity" 
        />
        <Drawer.Content 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[110] flex max-h-[92vh] flex-col bg-white dark:bg-gray-900 rounded-t-[24px] border-t border-gray-100 dark:border-gray-800 shadow-2xl focus:outline-none",
            className
          )}
        >
          {/* Touch Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 my-3" />

          {renderHeader()}

          <div
            className={cn(
              "flex-1 overflow-y-auto px-5 py-4 pb-8",
              contentClassName
            )}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

