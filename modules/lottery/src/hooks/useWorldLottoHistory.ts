import { useQuery } from "@tanstack/react-query";
import { useZeroDev } from "@wf-platform/web3-core";
import { TicketRecord } from "./useLottery3DHistory";
import { formatUnits } from "viem";
import { lotto7Tier, formatTokenAmount, padNumber } from "../utils/prizeMath";

export function useWorldLottoHistory(page: number = 1, pageSize: number = 10) {
  const { aaAddress } = useZeroDev();

  return useQuery({
    queryKey: ["lottoUmaHistory", aaAddress, page, pageSize],
    queryFn: async (): Promise<{ data: TicketRecord[]; total: number }> => {
      if (!aaAddress) return { data: [], total: 0 };
      
      const res = await fetch(`https://wf.vip/indexer/lotto-uma/history/${aaAddress}/page?page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to fetch World Lotto history");
      
      const responseData = await res.json();
      const rawArray: any[] = Array.isArray(responseData) ? responseData : (responseData.data || responseData.items || []);
      
      // Sort descending by blockTimestamp if needed (though indexer should already sort)
      rawArray.sort((a, b) => Number(b.blockTimestamp || 0) - Number(a.blockTimestamp || 0));
      
      const pagedItems = rawArray;
      const computedTotal = responseData.total || ((page - 1) * pageSize + rawArray.length + (responseData.hasMore ? 1 : 0));
      
      const data = pagedItems.map((item: any): TicketRecord => {
        const number = Number(item.number);
        const roundWinningNumber = item.roundWinningNumber != null && item.roundWinningNumber !== "" 
          ? Number(item.roundWinningNumber) 
          : undefined;

        const settled = ["Settled", "Resolved", "Drawn"].includes(String(item.roundStatus)) && roundWinningNumber !== undefined;
        const prizeTier = settled ? lotto7Tier(number, roundWinningNumber) : 0;
        const multiplier = Number(item.multiplier ?? 1);

        const roundPayout = (tier: number): bigint => {
          if (tier <= 0) return 0n;
          const val = item[`roundPayout${tier}`];
          return val != null ? BigInt(val) : 0n;
        };

        const prizeAmountBigInt = roundPayout(prizeTier) * BigInt(multiplier);
        const prizeAmountNumber = Number(formatUnits(prizeAmountBigInt, 6));

        const costBigInt = item.paid != null 
          ? BigInt(item.paid) 
          : (item.roundTicketPrice != null ? BigInt(item.roundTicketPrice) * BigInt(multiplier) : 1000000n * BigInt(multiplier));

        const isSettled = item.roundStatus === "Settled" || item.roundStatus === "Resolved";
        const isDrawn = item.roundStatus === "Drawn";
        const isCancelled = item.roundStatus === "Cancelled";

        let isWon = false;
        let prize = "0 USD";
        let netPnL = "0 USD";
        let isNetNegative = false;

        if (isSettled) {
          if (prizeAmountBigInt > 0n) {
            isWon = true;
            prize = `+${formatTokenAmount(prizeAmountBigInt, 6)} USD`;
            const pnlBigInt = prizeAmountBigInt - costBigInt;
            if (pnlBigInt > 0n) {
              netPnL = `+${formatTokenAmount(pnlBigInt, 6)} USD`;
              isNetNegative = false;
            } else if (pnlBigInt < 0n) {
              netPnL = `-${formatTokenAmount(-pnlBigInt, 6)} USD`;
              isNetNegative = true;
            } else {
              netPnL = "0 USD";
              isNetNegative = false;
            }
          } else {
            isWon = false;
            prize = "0 USD";
            netPnL = `-${formatTokenAmount(costBigInt, 6)} USD`;
            isNetNegative = true;
          }
        } else if (isDrawn) {
          if (prizeTier > 0) {
            isWon = true;
            prize = "待结算";
            netPnL = "待结算";
          } else {
            isWon = false;
            prize = "0 USD";
            netPnL = "待结算";
          }
        } else if (isCancelled) {
          prize = "—";
          netPnL = "—";
        } else {
          prize = "—";
          netPnL = "—";
        }

        const canClaim = isSettled && prizeAmountBigInt > 0n && !item.claimed && !item.refunded;
        const canRefund = isCancelled && !item.refunded && !item.claimed && !!item.ticketId && /^\d+$/.test(String(item.ticketId));

        return {
          id: `UMA-${item.ticketId}`,
          ticketId: String(item.ticketId),
          roundId: String(item.roundId),
          gameType: "UMA",
          number: padNumber(item.number, 7),
          status: item.roundStatus as "Open" | "Settled" | "Cancelled",
          isWon,
          prize,
          netPnL,
          isNetNegative,
          blockTimestamp: Number(item.blockTimestamp),
          claimed: Boolean(item.claimed),
          canClaim,
          canRefund,
          refunded: Boolean(item.refunded),
          roundStatus: item.roundStatus,
          prizeAmount: prizeAmountNumber,
          prizeTier,
          roundWinningNumber: roundWinningNumber !== undefined ? padNumber(roundWinningNumber, 7) : undefined,
        };
      });
      
      return { data, total: computedTotal };
    },
    enabled: !!aaAddress,
  });
}
