"use client";

import React from "react";
import { LotteryHistoryView } from "../../../components/history/LotteryHistoryView";
import { useLottery3DHistory } from "../../../hooks/useLottery3DHistory";
import { toast } from "sonner";
import { BetOrderRecord } from "../../../components/history/types";
import { useWeb3Action } from "@wf-platform/hooks";
import { LOTTO_3D_ADDRESSES } from "../../../config/addresses";
import { polygon } from "viem/chains";
import { wusdLotto3dGameV4Abi } from "../../../config/abis";
import { useQueryClient } from "@tanstack/react-query";
import { useZeroDev } from "@wf-platform/web3-core";

export function MyTickets3DTabContent() {
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const { data: queryData, isFetching } = useLottery3DHistory(page, pageSize);
  const records = queryData?.data || [];
  const total = queryData?.total || 0;

  const { aaAddress, kernelClient } = useZeroDev();
  const { execute } = useWeb3Action();
  const queryClient = useQueryClient();

  // Map TicketRecord to BetOrderRecord expected by LotteryHistoryView
  const orders: BetOrderRecord[] = records.map((r: any) => {
    const isCancelled = r.roundStatus === "Cancelled";
    const isDrawn = r.roundStatus === "Drawn";
    const isSettled = r.roundStatus === "Settled" || r.roundStatus === "Resolved";
    const canRefund = Boolean(r.canRefund && !r.refunded && !r.claimed);
    const canClaim = Boolean(r.canClaim && !r.refunded && !r.claimed);
    
    let displayStatus = "待开奖";
    if (r.refunded) {
      displayStatus = "已退款";
    } else if (r.claimed) {
      displayStatus = "已领取";
    } else if (isCancelled) {
      displayStatus = "已取消";
    } else if (isDrawn) {
      displayStatus = (r.prizeTier && r.prizeTier > 0) ? "中奖 · 待结算" : "待结算";
    } else if (isSettled) {
      displayStatus = (r.isWon || (r.prizeAmount && r.prizeAmount > 0)) ? "中奖 · 待领取" : "未中奖";
    }

    const isWin = Boolean(r.isWon || displayStatus === "中奖 · 待领取" || displayStatus === "中奖 · 待结算");
    
    return {
      id: r.id,
      issue: r.roundId,
      ticketId: r.ticketId,
      numbers: r.number,
      winningNumber: r.roundWinningNumber,
      multiplier: 1, // 3D doesn't have multipliers like UMA
      amount: r.netPnL === "0 USD" ? "未知" : Math.abs(parseFloat(r.netPnL)) + " WUSD", 
      time: new Date(r.blockTimestamp * 1000).toLocaleString(),
      status: displayStatus,
      isWin,
      prize: r.prize,
      netPnL: r.netPnL,
      isNetNegative: r.isNetNegative,
      canClaim,
      canRefund,
      isRefunded: r.refunded,
      isClaimed: r.claimed,
    };
  });

  const handleClaim = async (recordId: string) => {
    const record = records.find((r: any) => r.id === recordId);
    if (!record || !record.ticketId) return;

    try {
      const txHash = await execute(async () => {
        if (!kernelClient) throw new Error("Wallet not connected");
        return await kernelClient.writeContract({
          address: LOTTO_3D_ADDRESSES[polygon.id].game,
          abi: wusdLotto3dGameV4Abi,
          functionName: "claim",
          args: [BigInt(record.ticketId)],
        });
      });
      if (!txHash) return;

      toast.success("领奖成功");
      queryClient.setQueryData(["lotto3dHistory", aaAddress, page, pageSize], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: any) => r.id === recordId ? { ...r, claimed: true } : r)
        };
      });
    } catch (error) {
      console.error("Claim error:", error);
    }
  };

  const handleRefund = async (recordId: string) => {
    const record = records.find((r: any) => r.id === recordId);
    if (!record || !record.ticketId) return;

    try {
      const txHash = await execute(async () => {
        if (!kernelClient) throw new Error("Wallet not connected");
        return await kernelClient.writeContract({
          address: LOTTO_3D_ADDRESSES[polygon.id].game,
          abi: wusdLotto3dGameV4Abi,
          functionName: "refundTicket",
          args: [BigInt(record.ticketId)],
        });
      });
      if (!txHash) return;

      toast.success("退款成功");
      queryClient.setQueryData(["lotto3dHistory", aaAddress, page, pageSize], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: any) => r.id === recordId ? { ...r, refunded: true } : r)
        };
      });
    } catch (error) {
      console.error("Refund error:", error);
    }
  };

  return (
    <div className="w-full">
      <LotteryHistoryView 
        ballCount={3} 
        gameType="3d" 
        currency="WUSD" 
        currentIssue="-" 
        orders={orders}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onClaim={handleClaim}
        onRefund={handleRefund}
        loading={isFetching}
      />
    </div>
  );
}
