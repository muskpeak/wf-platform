"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { LOTTO_3D_ADDRESSES, FUNDING_ADDRESSES } from "../config/addresses";
import { polygon } from "viem/chains";
import { unifiedLedgerV4Abi } from "../config/abis/unifiedLedgerV4Abi";
import { lotto3dGameAbi } from "../config/abis/lotto3dGameAbi";
import { useZeroDev } from "@wf-platform/web3-core";
import {
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
  keccak256,
  zeroHash,
  formatUnits,
  type Hex,
} from "viem";
import {
  buildPartnerWfOrderId,
  generateLocalOrderId,
} from "../utils/worldLotto";

export interface Use3DLottoPurchaseOptions {
  partnerCode?: Hex;
}

export function use3DLottoPurchase(options?: Use3DLottoPurchaseOptions) {
  const { kernelClient, aaAddress } = useZeroDev();
  const chainId = polygon.id;
  const publicClient = usePublicClient({ chainId });

  const [isWriting, setIsWriting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  const executePurchase = async (
    roundId: number,
    singlePrice: bigint,
    numbers: number[]
  ) => {
    const partnerCode = options?.partnerCode;
    if (!partnerCode || !partnerCode.trim() || partnerCode === zeroHash) {
      throw new Error("渠道码 (PARTNER_CODE) 不能为空或未配置，请在 .env 中设置 PARTNER_CODE");
    }
    if (!aaAddress) throw new Error("请先连接钱包并登录");
    if (!kernelClient || !publicClient) {
      throw new Error("智能钱包客户端正在初始化，请稍候再试");
    }
    if (numbers.length === 0) {
      throw new Error("请至少选择一张彩票");
    }

    setIsWriting(true);
    setIsConfirmed(false);

    try {
      const totalAmount = singlePrice * BigInt(numbers.length);

      console.log("%c============== 🎲【Lotto 3D】开始执行统一下单 ==============", "color: #10B981; font-weight: bold; font-size: 14px;");
      console.log("【1. 下单入参详情】", {
        "期号 (roundId)": roundId,
        "总张数": numbers.length,
        "每张单价 (WUSD)": `${formatUnits(singlePrice, 6)} WUSD`,
        "总扣款金额 (WUSD)": `${formatUnits(totalAmount, 6)} WUSD`,
        "投注号码数组 (0~999)": numbers,
        "扣款 AA 钱包 (owner)": aaAddress,
      });

      // 0. 链上实况预检
      try {
        const onChainRound = (await publicClient.readContract({
          address: LOTTO_3D_ADDRESSES[chainId].game,
          abi: lotto3dGameAbi,
          functionName: "getRound",
          args: [roundId],
        })) as any;

        const currentTime = Math.floor(Date.now() / 1000);
        console.log("【2. 链上 3D 该期真实状态 getRound】", {
          "期号": roundId,
          "是否存在 (exists)": onChainRound?.exists,
          "状态 (status 1=Open, 2=Closed)": onChainRound?.status,
          "开售时间 (salesOpenTime)": onChainRound?.config?.salesOpenTime?.toString(),
          "封盘时间 (salesCloseTime)": onChainRound?.config?.salesCloseTime?.toString(),
          "当前本地时间戳": currentTime,
        });

        if (!onChainRound?.exists || onChainRound?.status !== 1) {
          console.warn("⚠️【注意】链上该期 status 不为 1 (Open)，若强制发送可能导致合约回滚！");
        }
      } catch (checkErr) {
        console.warn("【链上 3D 期次预检跳过】:", checkErr);
      }

      // 1. 严格从链上读取 purchaseNonces(aaAddress)
      console.log("【3. 正在读取用户链上 UnifiedLedger.purchaseNonces...】");
      const nonce = (await publicClient.readContract({
        address: FUNDING_ADDRESSES[chainId].unifiedLedger,
        abi: unifiedLedgerV4Abi,
        functionName: "purchaseNonces",
        args: [aaAddress as Hex],
      })) as bigint;
      console.log(`【4. 链上最新 purchaseNonces】: ${nonce.toString()}`);

      // 2. 编码 3D 专用 purchaseData: (uint40, uint16[])
      const purchaseData = encodeAbiParameters(
        parseAbiParameters("uint40, uint16[]"),
        [roundId, numbers]
      );
      console.log("【5. 编码后的 purchaseData (十六进制)】:", purchaseData);

      // 3. 构建渠道订单号与 PurchaseRequestV4 结构体
      const wfOrderId = buildPartnerWfOrderId({
        chainId,
        ledger: FUNDING_ADDRESSES[chainId].unifiedLedger as Hex,
        partnerCode,
        localOrderId: generateLocalOrderId(),
        owner: aaAddress as Hex,
        nonce,
      });

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const request = {
        owner: aaAddress as Hex,
        game: LOTTO_3D_ADDRESSES[chainId].game,
        beneficiary: aaAddress as Hex,
        amount: totalAmount,
        purchaseDataHash: keccak256(purchaseData),
        wfOrderId,
        partnerCode,
        nonce,
        deadline,
      };

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

      // 4. 通过 ZeroDev 智能钱包发送交易
      console.log("【8. 正在通过 ZeroDev 智能钱包向 Bundler 发送 UserOperation (executePurchaseV4)...】");
      const txHash = await kernelClient.sendTransaction({
        to: FUNDING_ADDRESSES[chainId].unifiedLedger,
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
      console.error("%c❌【use3DLottoPurchase】下单发生异常/失败:", "color: red; font-weight: bold;", error);
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
