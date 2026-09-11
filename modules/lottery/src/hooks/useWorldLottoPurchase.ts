"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { WORLD_LOTTO_ADDRESSES, FUNDING_ADDRESSES } from "../config/addresses";
import { polygon } from "viem/chains";
import { unifiedLedgerV4Abi } from "../config/abis/unifiedLedgerV4Abi";
import { lotto7UmaRoundsAbi } from "../config/abis/lotto7UmaRoundsAbi";
import {
  buildPurchaseRequestV4,
  buildPartnerWfOrderId,
  encodeWorldLottoPurchaseData,
  generateLocalOrderId,
} from "../utils/worldLotto";
import { useZeroDev } from "@wf-platform/web3-core";
import { encodeFunctionData, formatUnits, type Hex } from "viem";

export function useWorldLottoPurchase() {
  const { kernelClient, aaAddress } = useZeroDev();
  const chainId = polygon.id;
  const publicClient = usePublicClient({ chainId });

  const [isWriting, setIsWriting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  const PARTNER_CODE = "0xb1e2478e8a8772952d01c1e9aef1fb6bd7fa37b252352b4e4b60015044109258" as Hex;

  const executePurchase = async (
    roundId: number,
    totalAmount: bigint,
    numbers: number[],
    multipliers: number[]
  ) => {
    if (!aaAddress) throw new Error("请先连接钱包并登录");
    if (!kernelClient || !publicClient) {
      throw new Error("智能钱包客户端正在初始化，请稍候再试");
    }

    setIsWriting(true);
    setIsConfirmed(false);

    try {
      console.log("%c============== 🚀【WF 全球乐透】开始执行统一 V4 下单 ==============", "color: #008cff; font-weight: bold; font-size: 14px;");
      console.log("【1. 下单基础入参】", {
        "期号 (roundId)": roundId,
        "总扣款金额 (Wei)": totalAmount.toString(),
        "总扣款金额 (WUSD)": `${formatUnits(totalAmount, 6)} WUSD`,
        "注数": numbers.length,
        "投注号码数组 (numbers)": numbers,
        "倍率数组 (multipliers)": multipliers,
        "当前扣款 AA 钱包 (owner)": aaAddress,
      });

      // 0. 链上实况预检：检查该期在合约中的真实状态
      try {
        const onChainRound = (await publicClient.readContract({
          address: WORLD_LOTTO_ADDRESSES[chainId].rounds as Hex,
          abi: lotto7UmaRoundsAbi,
          functionName: "getRound",
          args: [roundId],
        })) as any;

        const currentTime = Math.floor(Date.now() / 1000);
        console.log("【2. 链上该期真实状态 getRound】", {
          "期号": roundId,
          "是否存在 (exists)": onChainRound?.exists,
          "销售是否已截止 (salesClosed)": onChainRound?.salesClosed,
          "是否已取消 (cancelled)": onChainRound?.cancelled,
          "开奖状态 (drawStatus)": onChainRound?.drawStatus,
          "开盘时间 (salesOpenTime)": onChainRound?.config?.salesOpenTime?.toString(),
          "封盘时间 (salesCloseTime)": onChainRound?.config?.salesCloseTime?.toString(),
          "当前本地时间戳": currentTime,
        });

        if (!onChainRound?.exists || onChainRound?.salesClosed || onChainRound?.cancelled) {
          console.error("%c❌【注意】链上该期未开启投注！" +
            `exists=${onChainRound?.exists}, salesClosed=${onChainRound?.salesClosed}, cancelled=${onChainRound?.cancelled}。` +
            "若继续向合约发起 UserOp，合约 simulation 必然报 0x402bc007 (RoundNotOpen)！",
            "color: red; font-weight: bold;"
          );
        }
      } catch (checkErr) {
        console.warn("【链上期次预检跳过或失败】:", checkErr);
      }

      // 1. 严格从链上读取真实的 purchaseNonces(aaAddress)
      console.log("【3. 正在读取用户链上 UnifiedLedger.purchaseNonces...】");
      const nonce = (await publicClient.readContract({
        address: FUNDING_ADDRESSES[chainId].unifiedLedger as Hex,
        abi: unifiedLedgerV4Abi,
        functionName: "purchaseNonces",
        args: [aaAddress as Hex],
      })) as bigint;

      console.log(`【4. 链上最新 purchaseNonces】: ${nonce.toString()}`);

      // 2. 编码投注数据
      const purchaseData = encodeWorldLottoPurchaseData(roundId, numbers, multipliers);
      console.log("【5. 编码后的 purchaseData (十六进制)】:", purchaseData);

      // 3. 构建订单与请求（三方规范：默认使用 zeroHash 避免未经配置的 partnerCode 导致分成路由报错）
      const wfOrderId = buildPartnerWfOrderId({
        chainId,
        ledger: FUNDING_ADDRESSES[chainId].unifiedLedger as Hex,
        partnerCode: PARTNER_CODE,
        localOrderId: generateLocalOrderId(),
        owner: aaAddress as Hex,
        nonce,
      });

      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const request = buildPurchaseRequestV4({
        owner: aaAddress as Hex,
        game: WORLD_LOTTO_ADDRESSES[chainId].rounds as Hex,
        beneficiary: aaAddress as Hex,
        amount: totalAmount,
        purchaseData,
        wfOrderId,
        partnerCode: PARTNER_CODE,
        nonce,
        deadline,
      });

      console.log("【6. 构建完整的 PurchaseRequestV4 结构体】:", {
        owner: request.owner,
        game: request.game,
        beneficiary: request.beneficiary,
        amount: request.amount.toString(),
        purchaseDataHash: request.purchaseDataHash,
        wfOrderId: request.wfOrderId,
        partnerCode: request.partnerCode,
        nonce: request.nonce.toString(),
        deadline: request.deadline,
      });

      const callData = encodeFunctionData({
        abi: unifiedLedgerV4Abi,
        functionName: "executePurchaseV4",
        args: [request, purchaseData],
      });

      console.log("【7. 最终发送给 UnifiedLedger 的 callData (十六进制)】:", callData);

      // 4. 通过 ZeroDev 智能钱包发送交易 (AA 钱包作为 msg.sender，完全匹配 request.owner)
      console.log("【8. 正在通过 ZeroDev 智能钱包向 Bundler 发送 UserOperation (executePurchaseV4)...】");
      const txHash = await kernelClient.sendTransaction({
        to: FUNDING_ADDRESSES[chainId].unifiedLedger as Hex,
        data: callData,
        value: 0n,
      });

      console.log("%c【9. 交易已成功广播上链！】TxHash: " + txHash, "color: green; font-weight: bold;");
      setHash(txHash);
      setIsWriting(false);
      setIsConfirming(true);

      // 5. 等待链上交易收据
      console.log("【10. 正在等待链上区块打包确认...】");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log("%c【11. 交易已最终确认入块！】Receipt:", "color: green; font-weight: bold;", receipt);

      setIsConfirming(false);
      setIsConfirmed(true);
      return txHash;
    } catch (error: any) {
      console.error("%c❌【useWorldLottoPurchase】下单发生异常/失败:", "color: red; font-weight: bold;", error);
      if (String(error?.message || "").includes("0x402bc007")) {
        console.error("%c👉 错误分析: 合约回滚 0x402bc007 对应 RoundNotOpen()，代表当前轮次在链上已被关闭销售 (salesClosed=true) 或尚未开启！", "color: orange; font-weight: bold;");
      }
      setIsWriting(false);
      setIsConfirming(false);
      throw error;
    }
  };

  return {
    executePurchase,
    isWriting,
    isConfirming,
    isConfirmed,
    hash,
  };
}
