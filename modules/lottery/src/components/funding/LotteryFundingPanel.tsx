"use client";

import React, { useState } from "react";
import { useLotteryFunding } from "../../hooks/useLotteryFunding";
import { polygon } from "viem/chains";
import { createPublicClient, http } from "viem";

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(),
});

import { toast } from "sonner";

export interface LotteryFundingPanelProps {
  aaAddress?: string | null;
  kernelClient?: any;
}

export function LotteryFundingPanel({ aaAddress, kernelClient }: LotteryFundingPanelProps) {
  const [amount, setAmount] = useState("");

  const {
    wusdBalance,
    deposit,
    isDepositing,
    withdraw,
    isWithdrawing
  } = useLotteryFunding(aaAddress ?? null, kernelClient, publicClient);

  const handleDeposit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("请输入正确金额");
      return;
    }
    deposit(num);
  };

  const handleWithdraw = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("请输入正确金额");
      return;
    }
    withdraw(num);
  };

  return (
    <div className="bg-white dark:bg-[#1A1B23] border border-gray-100 dark:border-[#2D2E3A] rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#8C90A8]">彩票游戏划转 (WUSD Funding)</h2>
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500 dark:text-[#8C90A8]">游戏内筹码 (WUSD)</span>
        <span className="text-2xl font-bold text-purple-600 dark:text-[#A78BFA] font-mono">
          {wusdBalance.isLoading ? "..." : wusdBalance.formatted}
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-[#8C90A8]">
          将平台 mUSDC 转换为彩票游戏可用的 WUSD 筹码。
        </p>
        
        <div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="输入划转金额"
            className="w-full bg-gray-50 dark:bg-[#0D0E12] border border-gray-200 dark:border-[#2D2E3A] rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#676FFF] transition-colors"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDeposit}
            disabled={isDepositing || isWithdrawing || !aaAddress}
            className="flex-1 bg-[#676FFF] hover:bg-[#565EE0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isDepositing ? "充值中..." : "充值到游戏 (Deposit)"}
          </button>
          
          <button
            onClick={handleWithdraw}
            disabled={isDepositing || isWithdrawing || !aaAddress}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-[#2D2E3A] dark:hover:bg-[#3D3E4A] disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isWithdrawing ? "提现中..." : "提现回平台 (Withdraw)"}
          </button>
        </div>
      </div>
    </div>
  );
}
