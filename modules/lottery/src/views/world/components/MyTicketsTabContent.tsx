"use client";

import React from "react";
import { LotteryHistoryView } from "../../../components/history/LotteryHistoryView";

export function MyTicketsTabContent() {
  return (
    <div className="w-full">
      <LotteryHistoryView ballCount={7} gameType="world" currency="USDT" currentIssue="2450" />
    </div>
  );
}
