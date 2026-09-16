"use client";

import React from "react";
import { HistoryTabId } from "./types";

interface HistorySubTabsProps {
  activeTab: HistoryTabId;
  onChange: (tab: HistoryTabId) => void;
  className?: string;
}

const TABS: { id: HistoryTabId; label: string }[] = [
  { id: "orders", label: "投注订单" },
  // { id: "rewards", label: "开奖与奖金" },
  // { id: "claims", label: "领奖记录" },
];

export function HistorySubTabs({ activeTab, onChange, className = "" }: HistorySubTabsProps) {
  return (
    <div className={`flex items-center gap-4 sm:gap-6 ${className}`}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`h-[36px] px-5 sm:px-6 rounded-full text-[14px] transition-all cursor-pointer whitespace-nowrap ${isActive
                ? "bg-[#131416] text-white font-semibold shadow-xs"
                : "text-[#777a8d] hover:text-[#18181b] font-medium"
              }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
