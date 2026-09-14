"use client";

import React, { useState } from "react";

export const PROFILE_TABS = [
  { key: "assets", label: "我的资产" },
  { key: "wallet", label: "我的钱包" },
  { key: "bets", label: "我的投注" },
  { key: "rewards", label: "我的奖金" },
  { key: "history", label: "交易记录" },
  { key: "withdraw", label: "提款中心" },
  { key: "settings", label: "账户设置" },
  { key: "security", label: "安全中心" },
];

export function ProfileTabs({
  activeTab = "assets",
  onTabChange,
}: {
  activeTab?: string;
  onTabChange?: (key: string) => void;
}) {
  const [current, setCurrent] = useState(activeTab);

  const handleSelect = (key: string) => {
    setCurrent(key);
    onTabChange?.(key);
  };

  return (
    <div className="hidden lg:flex items-center gap-8 border-b border-gray-200 dark:border-gray-800 text-sm overflow-x-auto">
      {PROFILE_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => handleSelect(tab.key)}
          className={`pb-3 font-medium transition-colors relative whitespace-nowrap ${
            current === tab.key
              ? "text-black dark:text-white border-b-2 border-black dark:border-white font-semibold"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
