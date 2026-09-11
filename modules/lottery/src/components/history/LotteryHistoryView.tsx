"use client";

import React, { useState } from "react";
import { HistoryTabId, LotteryHistoryProps } from "./types";
import { HistorySubTabs } from "./HistorySubTabs";
import { BetOrdersSection } from "./BetOrdersSection";
import { DrawRewardsSection } from "./DrawRewardsSection";
import { ClaimRecordsSection } from "./ClaimRecordsSection";

export function LotteryHistoryView({
  ballCount = 7,
  gameType = "world",
  currency = "USDT",
  currentIssue = "2450",
  stats,
  orders,
  rewards,
  claims,
  onClaim,
  className = "",
}: LotteryHistoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<HistoryTabId>("orders");

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`}>
      {/* Top Secondary Tabs Switcher */}
      <div className="flex items-center justify-start">
        <HistorySubTabs activeTab={activeSubTab} onChange={setActiveSubTab} />
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {activeSubTab === "orders" && (
          <BetOrdersSection
            ballCount={ballCount}
            currency={currency}
            currentIssue={currentIssue}
            stats={stats}
            orders={orders}
          />
        )}

        {activeSubTab === "rewards" && (
          <DrawRewardsSection
            ballCount={ballCount}
            currency={currency}
            rewards={rewards}
          />
        )}

        {activeSubTab === "claims" && (
          <ClaimRecordsSection
            ballCount={ballCount}
            currency={currency}
            claims={claims}
            onClaim={onClaim}
          />
        )}
      </div>
    </div>
  );
}

export * from "./types";
export * from "./HistorySubTabs";
export * from "./BetOrdersSection";
export * from "./DrawRewardsSection";
export * from "./ClaimRecordsSection";
export * from "./HistoryPagination";
