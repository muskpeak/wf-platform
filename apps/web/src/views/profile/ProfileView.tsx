"use client";

import React, { useState, useMemo } from "react";
import { useZeroDev, usePlatformBalances } from "@wf-platform/web3-core";
import { useLotteryFunding } from "../../../../../modules/lottery/src/hooks/useLotteryFunding";
import { FUNDING_ADDRESSES } from "../../../../../modules/lottery/src/config/addresses";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

import { USDC_ADDRESS } from "@wf-platform/chain-config";

import { UserInfoCard } from "./components/UserInfoCard";
import { TotalAssetCard } from "./components/TotalAssetCard";
import { AccountActionButtons } from "./components/AccountActionButtons";
import { SubAccountsCard } from "./components/SubAccountsCard";
import { QuickAccessGrid } from "./components/QuickAccessGrid";
import { ProfileTabs } from "./components/ProfileTabs";
import { AssetDetailTable } from "./components/AssetDetailTable";
import { TransferModal } from "./components/TransferModal";

export function ProfileView() {
  const [activeTab, setActiveTab] = useState("assets");
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { aaAddress, kernelClient } = useZeroDev();

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: polygon,
        transport: http(),
      }),
    []
  );

  // 1. WF 平台双账户余额：资金账户(真实 Polygon USDC) + 系统内临时测试币(mUSDC)
  const { realUsdc, mUsdc, refetchAll } = usePlatformBalances(aaAddress ?? null, {
    usdc: USDC_ADDRESS[polygon.id],
    mUsdc: FUNDING_ADDRESSES[polygon.id].mUSDC,
  });

  // 2. 彩票游戏账户余额 (金库中的 WUSD 余额) 及充提/划转方法
  const {
    wusdBalance: lotteryWusdBalance,
    refetchWusd,
    deposit,
    isDepositing,
    withdraw,
    isWithdrawing,
  } = useLotteryFunding(aaAddress ?? null, kernelClient, publicClient);

  // 3. 计算总资产：资金账户(真实 USDC) + 彩票账户(WUSD)；临时 mUSDC 严禁计入总资产
  const realUsdcAmount = parseFloat(realUsdc.formatted || "0");
  const lottoAmount = parseFloat(lotteryWusdBalance.formatted || "0");
  const totalAmount = realUsdcAmount + lottoAmount;
  const formattedTotal = totalAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleDepositTransfer = async (amount: number) => {
    await deposit(amount);
    refetchAll();
    refetchWusd();
  };

  const handleWithdrawTransfer = async (amount: number) => {
    await withdraw(amount);
    refetchAll();
    refetchWusd();
  };

  return (
    <div className="w-full max-w-[430px] lg:max-w-6xl mx-auto px-4 py-4 lg:py-8 space-y-6">
      {/* 桌面端头部标题 (PC端显示：账户工作台 / 个人中心) */}
      <div className="hidden lg:block space-y-1 mb-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">账户工作台</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h1>
      </div>

      {/* 顶部区域：移动端自上而下，PC端左右分栏 */}
      <div className="profile-top-grid">
        {/* 左侧模块：用户信息卡片 */}
        <div className="profile-left-col">
          <UserInfoCard />
        </div>

        {/* 右侧模块：总资产卡片 (PC端宽屏展示，移动端纵向堆叠) */}
        <div className="profile-right-col">
          <TotalAssetCard totalBalance={formattedTotal} />

          {/* 桌面端隐藏，移动端展示：三大核心操作按钮 */}
          <div className="block lg:hidden">
            <AccountActionButtons
              onOpenTransfer={() => setIsTransferOpen(true)}
            />
          </div>

          {/* 双账户卡片：资金账户(真实USDC) & 彩票账户(金库WUSD + 临时mUSDC) */}
          <SubAccountsCard
            wfBalance={realUsdc.formatted}
            lotteryBalance={lotteryWusdBalance.formatted}
            musdcBalance={mUsdc.formatted}
            onOpenTransfer={() => setIsTransferOpen(true)}
          />
        </div>
      </div>

      {/* 移动端专属：快捷入口 (资金记录 / 授权管理 / 安全设置) */}
      <div className="block lg:hidden pt-2">
        <QuickAccessGrid />
      </div>

      {/* 桌面端专属：Tab 栏与详细资产构成表格 */}
      <div className="hidden lg:block space-y-6 pt-4">
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "assets" && <AssetDetailTable />}
      </div>

      {/* 资金划转弹窗 */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        systemMusdcBalance={mUsdc.formatted}
        wfBalance={realUsdc.formatted}
        lotteryBalance={lotteryWusdBalance.formatted}
        onDeposit={handleDepositTransfer}
        onWithdraw={handleWithdrawTransfer}
        isDepositing={isDepositing}
        isWithdrawing={isWithdrawing}
      />

      <style jsx>{`
        .profile-top-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-left-col {
          width: 100%;
        }
        .profile-right-col {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .profile-top-grid {
            flex-direction: row;
            align-items: stretch;
          }
          .profile-left-col {
            width: 380px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
          }
          .profile-right-col {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
