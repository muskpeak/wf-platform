"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { use3DLottoStore } from "./store/use3DLottoStore";
import { LottoTabs } from "../../components/LottoTabs";
import { MyTickets3DTabContent } from "./components/MyTickets3DTabContent";
import { Rules3DTabContent } from "./components/Rules3DTabContent";
import { IssueStatusStrip } from "../../components/common/IssueStatusStrip";
import { NumberPickerCard, LOTTO_3D_SLOTS } from "../../components/common/NumberPickerCard";
import { CurrentBetSummaryCard } from "../../components/common/CurrentBetSummaryCard";
import { use3DLottoState } from "../../hooks/use3DLottoState";
import { use3DLottoPurchase } from "../../hooks/use3DLottoPurchase";
import { formatUnits, parseUnits, type Hex } from "viem";
import { toast } from "sonner";
import { useZeroDev } from "@wf-platform/web3-core";
import { useWeb3Action } from "@wf-platform/hooks";
import { unifiedLedgerV4Abi } from "../../config/abis/unifiedLedgerV4Abi";
import { lotto3dGameAbi } from "../../config/abis/lotto3dGameAbi";

export interface Lottery3DViewProps {
  partnerCode?: Hex;
}

export function Lottery3DView({ partnerCode }: Lottery3DViewProps = {}) {
  const {
    activeTab,
    setActiveTab,
    selectedDigits,
    focusedIndex,
    currentMultiplier,
    setFocusedIndex,
    setDigit,
    clearDigits,
    setCurrentMultiplier,
    addCurrentBet,
    addRandomBets,
    bets,
    removeBet,
    clearBets,
    updateBetMultiplier,
  } = use3DLottoStore();

  const {
    latestRoundId,
    roundData,
    ticketPrice,
    maxBatchSize,
    maxTicketsPerAddress,
    alreadyBoughtCount,
    wusdBalance,
    wusdBalanceFormatted,
    formattedTicketPrice,
    statusText,
    issueNote,
    countdownLabel,
    countdownNote,
    countdownStr,
    progressPercent,
    isEnded,
    isUpcoming,
    isSalesClosed,
    prizePoolStr,
    totalSalesStr,
    refetchAll,
  } = use3DLottoState();

  const { executePurchase, isWriting, isConfirming } = use3DLottoPurchase({ partnerCode });
  const { execute: executeWithWeb3Action, isPending: isActionPending } = useWeb3Action({
    abis: [unifiedLedgerV4Abi, lotto3dGameAbi],
    successMessage: "3D 彩票投注交易已成功提交并确认！",
  });
  const { aaAddress, authenticated, login } = useZeroDev();

  // 控制台中文日志输出，供开发者清晰核对链上真实返回的数据
  useEffect(() => {
    if (latestRoundId !== undefined || roundData) {
      console.group("🎲【Lotto 3D 链上合约真实数据】");
      console.log("📌 活动期号 (latestRoundId):", latestRoundId !== undefined ? Number(latestRoundId) : "加载中...");
      console.log("🎫 单张价格 (ticketPrice):", ticketPrice ? `${formatUnits(ticketPrice as bigint, 6)} WUSD` : "加载中...");
      console.log("🏆 综合奖池金额 (prizePool):", `${prizePoolStr} WUSD`);
      console.log("💰 本期销售总额 (totalSales):", `${totalSalesStr} WUSD`);
      console.log("🎟️ 本期总售出张数 (totalTickets):", roundData?.totalTickets !== undefined ? Number(roundData.totalTickets) : 0);
      console.log("🛑 单地址持票上限 (MAX_TICKETS_PER_ADDRESS):", maxTicketsPerAddress);
      console.log("👤 当前用户已购张数 (alreadyBoughtCount):", alreadyBoughtCount);
      console.log("⏰ 综合判定状态 (statusText):", statusText);
      console.log("🏷️ 倒计时提示语 (countdownLabel):", countdownLabel);
      console.log("📅 对应状态目标时间 (countdownNote):", countdownNote);
      console.log("🕒 本期开盘时间 (salesOpenTime):", roundData?.config?.salesOpenTime ? new Date(Number(roundData.config.salesOpenTime) * 1000).toLocaleString() : "--");
      console.log("🕒 本期封盘时间 (salesCloseTime):", roundData?.config?.salesCloseTime ? new Date(Number(roundData.config.salesCloseTime) * 1000).toLocaleString() : "--");
      console.log("🔢 单笔批量上限 (maxBatchSize):", maxBatchSize);
      console.log("📦 本期原始 RoundData 结构体:", roundData);
      console.groupEnd();
    }
  }, [latestRoundId, roundData, ticketPrice, maxBatchSize, maxTicketsPerAddress, alreadyBoughtCount, statusText, countdownLabel, countdownNote, prizePoolStr, totalSalesStr]);

  const handlePurchase = async () => {
    // 用户未登录时操作，主动弹窗引导登录
    if (!authenticated || !aaAddress) {
      login();
      return;
    }

    if (latestRoundId === undefined) {
      toast.error("当前期次信息未加载，请稍候");
      return;
    }
    if (bets.length === 0) {
      toast.error("请先选择号码并加入本次投注");
      return;
    }

    // 1. 严格校验批量下单上限 (合约 BatchTooLarge 防御)
    if (bets.length > maxBatchSize) {
      toast.error(`单笔批量投注最多支持 ${maxBatchSize} 张，当前已选 ${bets.length} 张，请删减后再提交`);
      return;
    }

    // 1.5 严格校验单地址单期最大持票上限 (合约 MAX_TICKETS_PER_ADDRESS 防御)
    const remainingAllowed = Math.max(0, maxTicketsPerAddress - alreadyBoughtCount);
    if (bets.length > remainingAllowed) {
      if (remainingAllowed === 0) {
        toast.error(`您在本期已购满 ${maxTicketsPerAddress} 张（已达单地址持票上限），无法继续加注`);
      } else {
        toast.error(
          `单期每地址最多只能持有 ${maxTicketsPerAddress} 张。您当期已购 ${alreadyBoughtCount} 张，本次最多还可购买 ${remainingAllowed} 张（当前已选 ${bets.length} 张）`
        );
      }
      return;
    }

    // 2. 严格校验号码格式 (000 ~ 999，每位 0-9)
    const invalidBet = bets.find(
      (b) => b.numbers.length !== 3 || b.numbers.some((d) => isNaN(d) || d < 0 || d > 9)
    );
    if (invalidBet) {
      toast.error("投注号码格式错误，每张必须为 3 位有效数字 (0-9)");
      return;
    }

    // 3. 按照官方 3D 合约逻辑，1 注即 1 张 (uint16[])，无倍数概念
    const numbers: number[] = bets.map((b) => parseInt(b.numbers.join(""), 10));
    const totalTickets = numbers.length;
    const singlePrice = ticketPrice ? (ticketPrice as bigint) : parseUnits("1", 6);
    const totalAmount = singlePrice * BigInt(totalTickets);

    if (totalAmount > wusdBalance) {
      toast.error(`WUSD 余额不足（需要 ${formatUnits(totalAmount, 6)} WUSD，当前可用 ${wusdBalanceFormatted} WUSD）`);
      return;
    }

    if (isUpcoming) {
      toast.error("当前轮次尚未开售，暂无法投注");
      return;
    }

    if (isSalesClosed || isEnded) {
      toast.error("当前轮次销售已截止，无法投注");
      return;
    }

    console.log(`🛒【执行 3D 投注】总张数: ${totalTickets} | 总金额: ${formatUnits(totalAmount, 6)} WUSD | 选号列表:`, numbers);

    await executeWithWeb3Action(async () => {
      const receipt = await executePurchase(latestRoundId, singlePrice, numbers);
      console.log("🎉 3D 投注交易确认成功:", receipt);
      clearBets();
      refetchAll();
      return receipt;
    });
  };

  const isPurchasing = isActionPending || isWriting || isConfirming;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f3f4f8] pb-20">
      {/* Top Tabs */}
      <LottoTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 w-full max-w-[430px] lg:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "current" && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 sm:gap-5"
            >
              {/* 1. Issue Status Strip (4核心色彩映射 + 实时链上状态倒计时) */}
              <IssueStatusStrip
                issueNo={latestRoundId !== undefined ? `${latestRoundId} 期` : "-- 期"}
                issueNote={issueNote}
                ticketPrice={`${formattedTicketPrice} WUSD`}
                ticketNote="3位数号码"
                prizePool={prizePoolStr}
                countdown={countdownStr}
                countdownLabel={countdownLabel}
                countdownNote={countdownNote}
                statusText={statusText}
                progressPercent={progressPercent}
                currency="WUSD"
              />

              {/* 2. Betting Zone: 3 digits + 隐藏倍数相关操作 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <NumberPickerCard
                  digitsCount={3}
                  slots={LOTTO_3D_SLOTS}
                  titleLabel="选择 3 位号码"
                  selectedDigits={selectedDigits}
                  focusedIndex={focusedIndex}
                  currentMultiplier={currentMultiplier}
                  setFocusedIndex={setFocusedIndex}
                  setDigit={setDigit}
                  clearDigits={clearDigits}
                  setCurrentMultiplier={setCurrentMultiplier}
                  addCurrentBet={addCurrentBet}
                  addRandomBets={addRandomBets}
                  hideMultiplier={true}
                />
                <CurrentBetSummaryCard
                  bets={bets}
                  removeBet={removeBet}
                  clearBets={clearBets}
                  updateBetMultiplier={updateBetMultiplier}
                  onConfirm={handlePurchase}
                  onLogin={login}
                  isLoggedIn={Boolean(authenticated && aaAddress)}
                  isLoading={isPurchasing}
                  isSalesClosed={isSalesClosed}
                  isEnded={isEnded}
                  isUpcoming={isUpcoming}
                  hideMultiplier={true}
                  ticketPrice={formattedTicketPrice}
                  currency="WUSD"
                />
              </div>
            </motion.div>
          )}

          {activeTab === "mytickets" && (
            <motion.div
              key="mytickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 w-full"
            >
              <MyTickets3DTabContent />
            </motion.div>
          )}

          {activeTab === "rules" && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <Rules3DTabContent />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { Lottery3DView as Lottery3DPage };
