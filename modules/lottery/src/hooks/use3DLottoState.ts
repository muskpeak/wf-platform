"use client";

import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";
import { LOTTO_3D_ADDRESSES, FUNDING_ADDRESSES } from "../config/addresses";
import { polygon } from "viem/chains";
import { lotto3dGameAbi } from "../config/abis/lotto3dGameAbi";
import { UNIFIED_LEDGER_ABI } from "../config/abis/UNIFIED_LEDGER_ABI";
import { useZeroDev } from "@wf-platform/web3-core";
import { formatUnits } from "viem";
import { useCountdown } from "./useCountdown";

export function use3DLottoState() {
  const { aaAddress } = useZeroDev();
  const chainId = polygon.id;

  // 1. 获取官方当前真正进行中轮次 (对齐官方 indexer: /lotto3d/current)
  // 原因：链上可能预先部署了下一期（如 218），但当前正在销售的是 217
  const { data: indexerCurrentRound, refetch: refetchCurrentRound } = useQuery({
    queryKey: ["indexer", "lotto3d", "current"],
    queryFn: async () => {
      try {
        const res = await fetch("https://wf.vip/indexer/lotto3d/current");
        if (!res.ok) return null;
        return (await res.json()) as {
          roundId?: string;
          status?: string;
          salesOpenTime?: string;
          salesCloseTime?: string;
          drawDeadline?: string;
          totalSales?: string;
          totalTickets?: string;
          winningNumber?: number | null;
          prizePool?: string | null;
        };
      } catch (err) {
        console.warn("[use3DLottoState] 获取官方 indexer current 失败，将回退链上直接计算:", err);
        return null;
      }
    },
    refetchInterval: 15000,
  });

  // 2. 获取游戏公共底池状态 (对齐官方后端: /api/v1/public/games/state 中的 carryPool)
  const { data: gamePublicState, refetch: refetchGameState } = useQuery({
    queryKey: ["bff", "games", "state"],
    queryFn: async () => {
      try {
        const res = await fetch("https://wf.vip/backend/api/v1/public/games/state");
        if (!res.ok) return null;
        return (await res.json()) as {
          lotto3d?: {
            paused?: boolean;
            ticketPrice?: string;
            carryPool?: string;
          };
        };
      } catch (err) {
        console.warn("[use3DLottoState] 获取官方 carryPool 失败:", err);
        return null;
      }
    },
    refetchInterval: 15000,
  });

  // 3. 读取 3D 链上最新期号 (链上回退保障)
  const { data: latestRoundIdRaw, refetch: refetchLatestRound } = useReadContract({
    address: LOTTO_3D_ADDRESSES[polygon.id].game,
    abi: lotto3dGameAbi,
    functionName: "latestRoundId",
    chainId,
    query: {
      refetchInterval: 15000,
    },
  });

  // 计算当前活动期号 activeRoundId:
  // 优先取 indexer 的 current.roundId；若 indexer 未就绪则取链上最新期号
  const activeRoundId =
    indexerCurrentRound?.roundId !== undefined
      ? Number(indexerCurrentRound.roundId)
      : latestRoundIdRaw !== undefined
      ? Number(latestRoundIdRaw)
      : undefined;

  // 4. 批量读取当前活动期次详情、单价、批量上限、单地址上限及当前用户已购张数
  const { data: roundDetails, refetch: refetchRoundDetails } = useReadContracts({
    contracts:
      activeRoundId !== undefined
        ? [
            {
              address: LOTTO_3D_ADDRESSES[polygon.id].game,
              abi: lotto3dGameAbi,
              functionName: "getRound",
              args: [BigInt(activeRoundId)],
              chainId,
            },
            {
              address: LOTTO_3D_ADDRESSES[polygon.id].game,
              abi: lotto3dGameAbi,
              functionName: "ticketPrice",
              chainId,
            },
            {
              address: LOTTO_3D_ADDRESSES[polygon.id].game,
              abi: lotto3dGameAbi,
              functionName: "MAX_BATCH_SIZE",
              chainId,
            },
            {
              address: LOTTO_3D_ADDRESSES[polygon.id].game,
              abi: lotto3dGameAbi,
              functionName: "MAX_TICKETS_PER_ADDRESS",
              chainId,
            },
            {
              address: LOTTO_3D_ADDRESSES[polygon.id].game,
              abi: lotto3dGameAbi,
              functionName: "ticketsPerAddress",
              args: [BigInt(activeRoundId), (aaAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`],
              chainId,
            },
          ]
        : [],
    query: {
      enabled: activeRoundId !== undefined,
      refetchInterval: 15000,
    },
  });

  const roundData = roundDetails?.[0]?.result as any;
  const ticketPrice = roundDetails?.[1]?.result as bigint | undefined;
  const maxBatchSizeRaw = roundDetails?.[2]?.result as bigint | undefined;
  const maxBatchSize = maxBatchSizeRaw ? Number(maxBatchSizeRaw) : 50;
  const maxTicketsPerAddressRaw = roundDetails?.[3]?.result as bigint | undefined;
  const maxTicketsPerAddress = maxTicketsPerAddressRaw ? Number(maxTicketsPerAddressRaw) : 10;
  const alreadyBoughtCountRaw = roundDetails?.[4]?.result as bigint | undefined;
  const alreadyBoughtCount = alreadyBoughtCountRaw ? Number(alreadyBoughtCountRaw) : 0;

  // 5. 读取用户平台记账本筹码余额 (WUSD)
  const { data: wusdBalanceData, refetch: refetchWusdBalance } = useReadContract({
    address: FUNDING_ADDRESSES[polygon.id].unifiedLedger,
    abi: UNIFIED_LEDGER_ABI,
    functionName: "balanceOf",
    args: aaAddress ? [aaAddress as `0x${string}`] : undefined,
    chainId,
    query: {
      enabled: !!aaAddress,
      refetchInterval: 10000,
    },
  });

  const wusdBalance = (wusdBalanceData as bigint | undefined) ?? 0n;
  const wusdBalanceFormatted = formatUnits(wusdBalance, 6);
  const formattedTicketPrice = ticketPrice ? formatUnits(ticketPrice, 6) : "1";

  // 6. 时间与状态机解析 (优先结合链上配置与 indexer 状态)
  const now = Math.floor(Date.now() / 1000);
  const salesOpenTime = roundData?.config?.salesOpenTime
    ? Number(roundData.config.salesOpenTime)
    : indexerCurrentRound?.salesOpenTime
    ? Number(indexerCurrentRound.salesOpenTime)
    : undefined;

  const salesCloseTime = roundData?.config?.salesCloseTime
    ? Number(roundData.config.salesCloseTime)
    : indexerCurrentRound?.salesCloseTime
    ? Number(indexerCurrentRound.salesCloseTime)
    : undefined;

  const rawStatus = Number(roundData?.status ?? 0); // 0=None, 1=Open, 2=SalesClosed, 3=Settled, 4=Cancelled
  const isCancelled = rawStatus === 4;
  const isSettled = rawStatus === 3;
  const isUpcoming = Boolean(salesOpenTime && now < salesOpenTime && !isCancelled && rawStatus !== 2);

  // 目标倒计时时间与进度条基准
  const targetTime = isUpcoming ? salesOpenTime : salesCloseTime;
  const baseOpenTime = isUpcoming ? undefined : salesOpenTime;

  const { formatted: countdownStr, progressPercent, isEnded } = useCountdown(targetTime, baseOpenTime);

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

  let statusText = "投注中";
  let issueNote = "投注进行中";
  let countdownLabel = "距封盘";
  let activeEventTime = salesCloseTime;

  if (isCancelled) {
    statusText = "已取消";
    issueNote = "本期已取消";
    countdownLabel = "状态";
    activeEventTime = undefined;
  } else if (isSettled) {
    statusText = "已开奖";
    issueNote = "开奖号码已公布";
    countdownLabel = "状态";
    activeEventTime = undefined;
  } else if (isUpcoming) {
    statusText = "即将开售";
    issueNote = "即将开售";
    countdownLabel = "距开售";
    activeEventTime = salesOpenTime;
  } else if (rawStatus === 2 || isEnded) {
    statusText = "已封盘";
    issueNote = "销售已截止，待开奖";
    countdownLabel = "距封盘";
    activeEventTime = salesCloseTime;
  } else {
    statusText = "投注中";
    issueNote = "投注进行中";
    countdownLabel = "距封盘";
    activeEventTime = salesCloseTime;
  }

  const countdownNote = formatUtcDateTime(activeEventTime);

  // 7. 3D 官方奖池计算逻辑：
  // 未结算时: headlinePool = carryPool (滚存底池) + round.totalSales / 2
  // 已结算时: headlinePool = round.prizePool
  const carryPoolRaw = gamePublicState?.lotto3d?.carryPool;
  const carryPool = carryPoolRaw ? BigInt(carryPoolRaw) : 0n;
  const onChainTotalSales = (roundData?.totalSales as bigint | undefined) ?? 0n;
  const onChainPrizePool = (roundData?.prizePool as bigint | undefined) ?? 0n;

  const currentRoundPool = isSettled ? onChainPrizePool : onChainTotalSales / 2n;
  const headlinePool = isSettled ? currentRoundPool : carryPool + currentRoundPool;

  const prizePoolStr = (Number(headlinePool) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalSalesStr = onChainTotalSales ? formatUnits(onChainTotalSales, 6) : "0.00";

  const refetchAll = () => {
    refetchCurrentRound();
    refetchGameState();
    refetchLatestRound();
    refetchRoundDetails();
    refetchWusdBalance();
  };

  return {
    latestRoundId: activeRoundId,
    roundData,
    ticketPrice,
    formattedTicketPrice,
    maxBatchSize,
    maxTicketsPerAddress,
    alreadyBoughtCount,
    wusdBalance,
    wusdBalanceFormatted,
    countdownStr,
    countdownLabel,
    countdownNote,
    statusText,
    issueNote,
    progressPercent,
    isUpcoming,
    isSalesClosed: rawStatus === 2 || isEnded,
    isEnded,
    isCancelled,
    isSettled,
    prizePoolStr,
    totalSalesStr,
    carryPool,
    refetchAll,
  };
}

