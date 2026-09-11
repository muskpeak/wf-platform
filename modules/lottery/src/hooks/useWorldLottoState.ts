import { useReadContract, useReadContracts } from "wagmi";
import { WORLD_LOTTO_ADDRESSES, FUNDING_ADDRESSES } from "../config/addresses";
import { polygon } from "viem/chains";
import { lotto7UmaRoundsAbi } from "../config/abis/lotto7UmaRoundsAbi";
import { UNIFIED_LEDGER_ABI } from "../config/abis/UNIFIED_LEDGER_ABI";
import { useZeroDev } from "@wf-platform/web3-core";

export function useWorldLottoState() {
  const { aaAddress } = useZeroDev();
  const chainId = polygon.id;

  // 1. 读取最新期号 (每 15 秒定时轮询更新)
  const { data: latestRoundId, refetch: refetchLatestRound } = useReadContract({
    address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
    abi: lotto7UmaRoundsAbi,
    functionName: "latestRoundId",
    chainId,
    query: {
      refetchInterval: 15000,
    },
  });

  // 2. 批量读取当前期次详情和单价 (每 15 秒同步刷新)
  const { data: roundDetails, refetch: refetchRoundDetails } = useReadContracts({
    contracts:
      latestRoundId !== undefined
        ? [
            {
              address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
              abi: lotto7UmaRoundsAbi,
              functionName: "getRound",
              args: [latestRoundId],
              chainId,
            },
            {
              address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
              abi: lotto7UmaRoundsAbi,
              functionName: "ticketPrice",
              chainId,
            },
            {
              address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
              abi: lotto7UmaRoundsAbi,
              functionName: "MAX_BATCH_SIZE",
              chainId,
            },
          ]
        : [],
    query: {
      enabled: latestRoundId !== undefined,
      refetchInterval: 15000,
    },
  });

  const roundData = roundDetails?.[0]?.result;
  const ticketPrice = roundDetails?.[1]?.result;
  const maxBatchSizeRaw = roundDetails?.[2]?.result;
  const maxBatchSize = maxBatchSizeRaw ? Number(maxBatchSizeRaw) : 10;

  // 3. 读取上一期期号 (通过合约 previousRoundId 查询，若返回 0 且当前 > 1 则回退 latest - 1)
  const { data: rawPreviousRoundId, refetch: refetchPreviousRoundId } = useReadContract({
    address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
    abi: lotto7UmaRoundsAbi,
    functionName: "previousRoundId",
    args: latestRoundId !== undefined ? [latestRoundId] : undefined,
    chainId,
    query: {
      enabled: latestRoundId !== undefined,
      refetchInterval: 30000,
    },
  });

  const previousRoundId =
    rawPreviousRoundId !== undefined && Number(rawPreviousRoundId) > 0
      ? Number(rawPreviousRoundId)
      : latestRoundId !== undefined && Number(latestRoundId) > 1
      ? Number(latestRoundId) - 1
      : undefined;

  // 4. 读取上一期详情 (包含开奖号码 winningNumber、总奖池 totalSales 等)
  const { data: previousRoundData, isLoading: isLoadingPreviousRound, refetch: refetchPreviousRound } = useReadContract({
    address: WORLD_LOTTO_ADDRESSES[polygon.id].rounds,
    abi: lotto7UmaRoundsAbi,
    functionName: "getRound",
    args: previousRoundId !== undefined ? [previousRoundId] : undefined,
    chainId,
    query: {
      enabled: previousRoundId !== undefined,
      refetchInterval: 30000,
    },
  });

  // 5. 读取用户平台记账本筹码余额 (WUSD)，使用 lottery 模块独立的 UNIFIED_LEDGER_ABI
  const { data: wusdBalanceData, refetch: refetchWusdBalance } = useReadContract({
    address: FUNDING_ADDRESSES[polygon.id].unifiedLedger,
    abi: UNIFIED_LEDGER_ABI,
    functionName: "balanceOf",
    args: aaAddress ? [aaAddress as `0x${string}`] : undefined,
    chainId,
    query: {
      enabled: !!aaAddress,
      refetchInterval: 15000,
    },
  });

  const wusdBalance = (wusdBalanceData as bigint) || 0n;
  const wusdBalanceFormatted = (Number(wusdBalance) / 1e6).toFixed(2);

  return {
    latestRoundId,
    roundData,
    ticketPrice,
    maxBatchSize,
    previousRoundId,
    previousRoundData,
    isLoadingPreviousRound,
    wusdBalance,
    wusdBalanceFormatted,
    refetchAll: () => {
      refetchLatestRound();
      refetchRoundDetails();
      refetchPreviousRoundId();
      refetchPreviousRound();
      refetchWusdBalance();
    },
  };
}
