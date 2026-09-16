"use client";

import React, { useMemo } from "react";
import { useZeroDev, usePlatformBalances } from "@wf-platform/web3-core";
import { polygon } from "viem/chains";
import { USDC_ADDRESS } from "@wf-platform/chain-config";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { FilterChips } from "./components/FilterChips";
import { RecordCard } from "./components/RecordCard";
import { MOCK_RECORDS } from "./mockData";

export function RecordsView() {
  const { aaAddress, isConnected } = useZeroDev();
  const { realUsdc } = usePlatformBalances(aaAddress ?? null, {
    usdc: USDC_ADDRESS[polygon.id],
  });

  // 余额展示：与 Figma "钱包 chip" 一致
  const balance = useMemo(() => {
    if (!isConnected) return "$0";
    const amt = parseFloat(realUsdc.formatted || "0");
    return "$" + amt.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }, [isConnected, realUsdc.formatted]);

  return (
    <div className="w-full flex flex-col" style={{ gap: 24 }}>
      {/* 顶部 Header（含返回、标题、余额 chip、头像） */}
      <Header balance={balance} />

      {/* 主内容区：搜索框 + 筛选行 + 记录卡片列表 */}
      <div
        className="flex flex-col"
        style={{
          width: 398,
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 0 24px",
          gap: 21,
          boxSizing: "border-box",
          borderBottom: "1px solid #DFE2ED",
        }}
      >
        <SearchBar />
        <FilterChips />
      </div>

      {/* 记录卡片列表 */}
      <div
        className="flex flex-col"
        style={{
          width: 398,
          maxWidth: "100%",
          margin: "0 auto",
          gap: 12,
          paddingBottom: 24,
          boxSizing: "border-box",
        }}
      >
        {MOCK_RECORDS.map((rec) => (
          <RecordCard key={rec.id} record={rec} />
        ))}
      </div>
    </div>
  );
}
