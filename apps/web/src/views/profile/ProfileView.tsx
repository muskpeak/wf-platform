"use client";

import React, { useMemo } from "react";
import { useZeroDev, usePlatformBalances } from "@wf-platform/web3-core";
import { polygon } from "viem/chains";
import { LotteryFundingPanel, FUNDING_ADDRESSES } from "@wf-platform/lottery";
import { useConfig } from "../../providers/ConfigProvider";

export function ProfileView() {
  const config = useConfig();
  const { aaAddress, kernelClient, isInitializing } = useZeroDev(
    config.ZERODEV_PROJECT_ID,
    polygon
  );

  const tokens = useMemo(() => ({
    usdc: config.USDC_ADDRESS as `0x${string}` | undefined,
    mUsdc: FUNDING_ADDRESSES[polygon.id]?.mUSDC,
  }), [config.USDC_ADDRESS]);

  const { realUsdc, mUsdc } = usePlatformBalances(aaAddress, tokens);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人中心 (Profile)</h1>

      <div className="bg-white dark:bg-[#1A1B23] border border-gray-100 dark:border-[#2D2E3A] rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-[#8C90A8]">
          WF 平台大盘资产 (AA 钱包)
        </h2>

        {isInitializing ? (
          <div className="text-gray-400">正在生成/连接智能钱包...</div>
        ) : !aaAddress ? (
          <div className="text-red-400">请先通过右上角登录 Privy</div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-[#8C90A8] mb-1">全链通用钱包地址</p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#0D0E12] p-3 rounded-lg font-mono text-sm border border-gray-200 dark:border-[#2D2E3A]">
                <span className="text-blue-600 dark:text-[#676FFF] break-all">{aaAddress}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-[#0D0E12] p-4 rounded-xl border border-gray-200 dark:border-[#2D2E3A]">
                <p className="text-sm text-gray-500 dark:text-[#8C90A8] mb-1">真 U 余额 (Native USDC)</p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                  {realUsdc.isLoading ? "..." : realUsdc.formatted}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#0D0E12] p-4 rounded-xl border border-gray-200 dark:border-[#2D2E3A]">
                <p className="text-sm text-gray-500 dark:text-[#8C90A8] mb-1">测试 U 余额 (mUSDC)</p>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {mUsdc.isLoading ? "..." : mUsdc.formatted}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LotteryFundingPanel aaAddress={aaAddress} kernelClient={kernelClient} />
    </div>
  );
}
