"use client";

import React from "react";
import { cn } from "@wf-platform/utils";
import { Icon } from "./components/Icon";
import type { IconNameType } from "./components/Icon/type";

export interface BottomNavItem {
  id: string;
  title: string;
  path: string;
  icon: string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  currentPath: string;
  LinkComponent?: any;
  onItemClick?: (item: BottomNavItem, e: React.MouseEvent) => boolean | void;
}

export function BottomNav({ items, currentPath, LinkComponent = "a", onItemClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[76px] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-[10px] lg:hidden">
      <div className="flex items-center justify-around w-full h-full">
        {items.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <LinkComponent
              key={item.id}
              href={item.path}
              onClick={(e: React.MouseEvent) => {
                if (onItemClick) {
                  const res = onItemClick(item, e);
                  if (res === false) {
                    e.preventDefault();
                  }
                }
              }}
              className="flex flex-col items-center justify-center flex-1 h-[56px] gap-[4px] active:scale-95 transition-transform"
            >
              <Icon 
                name={isActive ? `${item.icon}_active` as IconNameType : item.icon as IconNameType} 
                size={24}
                className={isActive ? "text-[#0088FF]" : "text-[#707070]"} 
              />
              <span 
                className={cn(
                  "text-[11px] leading-[15px] font-[family-name:var(--font-noto-sans-sc),sans-serif] text-center transition-colors h-[16px] flex items-center justify-center w-full",
                  isActive ? "font-bold text-[#303030] dark:text-white" : "font-medium text-[#707070]"
                )}
              >
                {item.title}
              </span>
            </LinkComponent>
          );
        })}
      </div>
    </div>
  );
}
