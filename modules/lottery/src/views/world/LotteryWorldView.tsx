"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldLottoStore } from "./store/useWorldLottoStore";
import { LottoTabs } from "../../components/LottoTabs";
import { IssueStatusStrip } from "../../components/common/IssueStatusStrip";
import { NumberPickerCard, WORLD_7_SLOTS } from "../../components/common/NumberPickerCard";
import { CurrentBetSummaryCard } from "../../components/common/CurrentBetSummaryCard";
import { LottoBanner } from "./components/LottoBanner";
import { SevenCountryRulesCard } from "./components/SevenCountryRulesCard";
import { PreviousIssueCard } from "./components/PreviousIssueCard";
import { UtcTimelineCard } from "./components/UtcTimelineCard";
import { MyTicketsTabContent } from "./components/MyTicketsTabContent";
import { RulesTabContent } from "./components/RulesTabContent";

import { useWorldLottoState } from "../../hooks/useWorldLottoState";
import { useCountdown } from "../../hooks/useCountdown";
import { useWorldLottoPurchase } from "../../hooks/useWorldLottoPurchase";
import { formatUnits, parseUnits, type Hex } from "viem";
import { toast } from "sonner";
import { useZeroDev } from "@wf-platform/web3-core";
import { useWeb3Action } from "@wf-platform/hooks";
import { unifiedLedgerV4Abi } from "../../config/abis/unifiedLedgerV4Abi";
import { lotto7UmaRoundsAbi } from "../../config/abis/lotto7UmaRoundsAbi";

export interface LotteryWorldViewProps {
  partnerCode?: Hex;
}

export function LotteryWorldView({ partnerCode }: LotteryWorldViewProps = {}) {
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
  } = useWorldLottoStore();

  const {
    latestRoundId,
    roundData,
    ticketPrice,
    maxBatchSize,
    previousRoundId,
    previousRoundData,
    isLoadingPreviousRound,
    wusdBalance,
    wusdBalanceFormatted,
    refetchAll,
  } = useWorldLottoState();

  const { executePurchase, isWriting, isConfirming } = useWorldLottoPurchase({ partnerCode });
  const { execute: executeWithWeb3Action, isPending: isActionPending } = useWeb3Action({
    abis: [unifiedLedgerV4Abi, lotto7UmaRoundsAbi],
    successMessage: "投注交易已成功提交并确认！",
  });
  const { aaAddress, authenticated, login } = useZeroDev();

  // 格式化价格 (动态从合约获取，6位精度)
  const formattedTicketPrice = ticketPrice ? formatUnits(ticketPrice as bigint, 6) : "1";
  
  // 格式化时间为标准的 "YYYY年M月D日 HH:mm:ss UTC"
  const formatUtcDateTime = (timestamp: number | undefined): string => {
    if (!timestamp) return "—";
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const mins = String(date.getUTCMinutes()).padStart(2, "0");
    const secs = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}年${month}月${day}日 ${hours}:${mins}:${secs} UTC`;
  };

  const now = Math.floor(Date.now() / 1000);
  const salesCloseTime = roundData?.config?.salesCloseTime ? Number(roundData.config.salesCloseTime) : undefined;
  const salesOpenTime = roundData?.config?.salesOpenTime ? Number(roundData.config.salesOpenTime) : undefined;
  const isSalesClosedRaw = Boolean(roundData?.salesClosed);
  const isCancelled = Boolean(roundData?.cancelled);
  const drawStatus = Number(roundData?.drawStatus ?? 0);

  // 判断是否处于“即将开售”状态 (now < salesOpenTime)
  const isUpcoming = Boolean(salesOpenTime && now < salesOpenTime && !isCancelled && !isSalesClosedRaw);

  let statusText = "投注中";
  let issueNote = "投注进行中";
  let countdownLabel = "封盘倒计时";
  let activeEventTime = salesCloseTime;
  let baseTimeForProgress: number | undefined = salesOpenTime;

  let winningNumberStr: string | undefined = undefined;
  if (drawStatus === 3 && roundData?.winningNumber !== undefined) {
    winningNumberStr = String(roundData.winningNumber).padStart(7, "0");
  }

  if (isCancelled) {
    statusText = "已取消";
    issueNote = "本期已取消";
    countdownLabel = "状态";
    activeEventTime = undefined;
    baseTimeForProgress = undefined;
  } else if (drawStatus === 3) {
    statusText = "已开奖";
    issueNote = "开奖号码已公布";
    countdownLabel = "开奖号码";
    activeEventTime = undefined;
    baseTimeForProgress = undefined;
  } else if (drawStatus === 2) {
    statusText = "断言被质疑";
    issueNote = "等待重新提交断言";
    countdownLabel = "状态";
    activeEventTime = undefined;
    baseTimeForProgress = undefined;
  } else if (drawStatus === 1) {
    statusText = "断言确认中";
    issueNote = "断言挑战期中";
    countdownLabel = "挑战期截止";
    activeEventTime = roundData?.config?.drawDataDeadline ? Number(roundData.config.drawDataDeadline) : salesCloseTime;
    baseTimeForProgress = salesCloseTime;
  } else if (isSalesClosedRaw) {
    statusText = "封盘待开奖";
    issueNote = "等待预言机提交开奖断言";
    countdownLabel = "状态";
    activeEventTime = undefined;
    baseTimeForProgress = undefined;
  } else if (salesCloseTime && now >= salesCloseTime) {
    statusText = "封盘操作已逾期";
    issueNote = "等待链上执行封盘操作";
    countdownLabel = "等待确认";
    activeEventTime = undefined;
    baseTimeForProgress = undefined;
  } else if (isUpcoming) {
    statusText = "即将开售";
    issueNote = "即将开售";
    countdownLabel = "开售倒计时";
    activeEventTime = salesOpenTime;
    baseTimeForProgress = undefined;
  } else {
    statusText = "投注中";
    issueNote = "投注进行中";
    countdownLabel = "封盘倒计时";
    activeEventTime = salesCloseTime;
    baseTimeForProgress = salesOpenTime;
  }

  const { formatted: countdownStr, progressPercent, isEnded } = useCountdown(activeEventTime, baseTimeForProgress);

  // 倒计时右侧对应的具体年月日时分秒 UTC
  const countdownNote = formatUtcDateTime(activeEventTime);

  // 格式化当前销售总额/奖池 (WUSD 为 6 位精度)
  const totalSalesStr = roundData?.totalSales ? formatUnits(roundData.totalSales as bigint, 6) : "0.00";

  // 控制台中文日志输出，供开发者清晰核对链上真实返回的数据
  useEffect(() => {
    if (latestRoundId !== undefined || roundData) {
      console.group("🎰【World Lotto 链上合约真实数据】");
      console.log("📌 最新期号 (latestRoundId):", latestRoundId !== undefined ? Number(latestRoundId) : "加载中...");
      console.log("🎫 单注价格 (ticketPrice):", ticketPrice ? `${formatUnits(ticketPrice as bigint, 6)} WUSD` : "加载中...");
      console.log("💰 本期累计销售额 (totalSales):", roundData?.totalSales ? `${formatUnits(roundData.totalSales as bigint, 6)} WUSD` : "0.00 WUSD");
      console.log("🎟️ 本期总投注注数 (totalUnits):", roundData?.totalUnits !== undefined ? Number(roundData.totalUnits) : 0);
      console.log("⏰ 综合判定状态 (statusText):", statusText);
      console.log("🏷️ 倒计时提示语 (countdownLabel):", countdownLabel);
      console.log("📅 对应状态目标时间 (countdownNote):", countdownNote);
      console.log("🕒 本期开盘时间 (salesOpenTime):", roundData?.config?.salesOpenTime ? new Date(Number(roundData.config.salesOpenTime) * 1000).toLocaleString() : "--");
      console.log("🕒 本期封盘时间 (salesCloseTime):", roundData?.config?.salesCloseTime ? new Date(Number(roundData.config.salesCloseTime) * 1000).toLocaleString() : "--");
      console.log("🔢 单笔批量注数上限 (MAX_BATCH_SIZE):", maxBatchSize);
      console.log("⏮️ 上期期号 (previousRoundId):", previousRoundId !== undefined ? previousRoundId : "加载中...");
      console.log("🏆 上期中奖号码 (winningNumber):", previousRoundData?.winningNumber !== undefined ? previousRoundData.winningNumber : "未开奖/待同步");
      console.log("💰 上期奖池金额 (previousTotalSales):", previousRoundData?.totalSales ? `${formatUnits(previousRoundData.totalSales as bigint, 6)} WUSD` : "0.00 WUSD");
      console.log("📦 上期原始数据 (previousRoundData):", previousRoundData);
      console.log("📦 本期原始 RoundData 结构体:", roundData);
      console.groupEnd();
    }
  }, [latestRoundId, roundData, ticketPrice, previousRoundId, previousRoundData, maxBatchSize, statusText, countdownLabel, countdownNote]);

  const handlePurchase = async () => {
    // 未登录时操作，主动拉起登录弹窗引导登录
    if (!authenticated || !aaAddress) {
      login();
      return;
    }

    if (latestRoundId === undefined) {
      toast.error("当前期次信息未加载，请稍候");
      return;
    }
    if (bets.length === 0) {
      toast.error("请先选择号码并加入购物车");
      return;
    }

    // 1. 判断并区分单注 vs 批量
    const isSingle = bets.length === 1;
    const orderTypeLabel = isSingle ? "单注投注" : `批量投注 (${bets.length} 注)`;

    // 2. 严格校验批量下单注数上限 (合约 BatchTooLarge 防御)
    if (bets.length > maxBatchSize) {
      toast.error(`单笔批量投注最多支持 ${maxBatchSize} 注，当前已选 ${bets.length} 注，请删减后再提交`);
      return;
    }

    // 3. 严格校验单注倍数限制 (合约 InvalidMultiplier 防御)
    const maxAllowedMultiplier = roundData?.config?.maxMultiplierPerTicket || 10000;
    const invalidMultiplierBet = bets.find(
      (b) => b.multiplier <= 0 || b.multiplier > maxAllowedMultiplier
    );
    if (invalidMultiplierBet) {
      toast.error(`单注倍数必须在 1 到 ${maxAllowedMultiplier} 之间`);
      return;
    }

    // 4. 严格校验号码格式 (合约 InvalidNumber 防御: 0 ~ 9999999)
    const invalidNumberBet = bets.find(
      (b) => b.numbers.length !== 7 || b.numbers.some((d) => isNaN(d) || d < 0 || d > 9)
    );
    if (invalidNumberBet) {
      toast.error("投注号码格式错误，每注必须为 7 位有效数字 (0-9)");
      return;
    }

    const numbers: number[] = [];
    const multipliers: number[] = [];
    let totalMultiplier = 0;

    bets.forEach((bet) => {
      const numStr = bet.numbers.join("");
      numbers.push(parseInt(numStr, 10));
      multipliers.push(bet.multiplier);
      totalMultiplier += bet.multiplier;
    });

    const singlePrice = ticketPrice ? (ticketPrice as bigint) : parseUnits("1", 6);
    const totalAmount = singlePrice * BigInt(totalMultiplier);

    if (totalAmount > wusdBalance) {
      toast.error(`WUSD 余额不足（需要 ${formatUnits(totalAmount, 6)} WUSD，当前可用 ${wusdBalanceFormatted} WUSD）`);
      return;
    }

    if (isUpcoming) {
      toast.error("当前轮次尚未开售，暂无法投注");
      return;
    }

    if (isSalesClosedRaw || isEnded) {
      toast.error("当前轮次销售已截止，无法投注");
      return;
    }

    console.log(`🛒【执行${orderTypeLabel}】总注数: ${totalMultiplier} | 总金额: ${formatUnits(totalAmount, 6)} WUSD | 订单详情:`, {
      numbers,
      multipliers,
      isSingle,
    });

    const txHash = await executeWithWeb3Action(async () => {
      return await executePurchase(
        Number(latestRoundId),
        totalAmount,
        numbers,
        multipliers
      );
    });

    if (txHash) {
      clearBets();
      setTimeout(() => {
        refetchAll();
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f3f4f8] pb-20">
      {/* Top Tabs */}
      <LottoTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 顶部余额显示 */}
      <div className="w-full max-w-[430px] lg:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-2 flex justify-end">
        <div className="text-sm text-gray-500 font-medium">
          WUSD 余额: <span className="text-gray-900 font-bold ml-1">{wusdBalanceFormatted}</span>
        </div>
      </div>

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
              {/* 1. Issue Status Strip */}
              <IssueStatusStrip 
                issueNo={latestRoundId !== undefined ? `${latestRoundId} 期` : "-- 期"}
                issueNote={issueNote}
                ticketPrice={`${formattedTicketPrice} WUSD`}
                prizePool={totalSalesStr}
                countdown={activeEventTime === undefined ? "--:--:--" : countdownStr}
                countdownLabel={countdownLabel}
                countdownNote={countdownNote}
                statusText={statusText}
                progressPercent={progressPercent}
                currency="WUSD"
                winningNumber={winningNumberStr}
              />

              {/* 2. Betting Zone: Mobile stacked, PC side-by-side equal height */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <NumberPickerCard
                  digitsCount={7}
                  slots={WORLD_7_SLOTS}
                  selectedDigits={selectedDigits}
                  focusedIndex={focusedIndex}
                  currentMultiplier={currentMultiplier}
                  setFocusedIndex={setFocusedIndex}
                  setDigit={setDigit}
                  clearDigits={clearDigits}
                  setCurrentMultiplier={setCurrentMultiplier}
                  addCurrentBet={addCurrentBet}
                  addRandomBets={addRandomBets}
                />
                <CurrentBetSummaryCard
                  bets={bets}
                  removeBet={removeBet}
                  clearBets={clearBets}
                  updateBetMultiplier={updateBetMultiplier}
                  onConfirm={handlePurchase}
                  onLogin={login}
                  isLoggedIn={Boolean(authenticated && aaAddress)}
                  isLoading={isWriting || isConfirming || isActionPending}
                  isSalesClosed={isSalesClosedRaw || isEnded}
                  isEnded={isEnded}
                  isUpcoming={isUpcoming}
                  ticketPrice={formattedTicketPrice}
                  currency="WUSD"
                />
              </div>

              {/* 3. Promotional Banner */}
              <LottoBanner />

              {/* 4. Bottom Info: PC 2-column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <SevenCountryRulesCard />
                <div className="flex flex-col gap-4 sm:gap-5 justify-between">
                  <PreviousIssueCard
                    roundId={previousRoundId}
                    winningNumber={previousRoundData?.winningNumber}
                    totalSales={previousRoundData?.totalSales}
                    cancelled={previousRoundData?.cancelled}
                    drawStatus={previousRoundData?.drawStatus}
                    isLoading={isLoadingPreviousRound}
                  />
                  <UtcTimelineCard />
                </div>
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
              <MyTicketsTabContent />
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
              <RulesTabContent />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { LotteryWorldView as LotteryWorldPage };
