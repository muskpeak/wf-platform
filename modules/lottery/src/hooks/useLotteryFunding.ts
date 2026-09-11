"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { STABLECOIN_RESERVE_ABI } from "../config/abis/STABLECOIN_RESERVE_ABI";
import { UNIFIED_LEDGER_ABI } from "../config/abis/UNIFIED_LEDGER_ABI";
import { ERC20_ABI } from "../config/abis/ERC20_ABI";
import { Address, encodeFunctionData } from "viem";
import { polygon } from "viem/chains";
import { FUNDING_ADDRESSES } from "../config/addresses";
import { apiClient } from "@wf-platform/api";
import { parseWeb3Error } from "@wf-platform/web3-core";

import { toast } from "sonner";

export function useLotteryFunding(aaAddress: string | null, kernelClient: any, publicClient?: any) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const address = aaAddress as Address | undefined;
  
  // 自动从配置中获取当前链的地址
  const chainId = polygon.id; // 未来可从 kernelClient/wagmi 动态获取
  const addresses = FUNDING_ADDRESSES[chainId];

  // 查询 WUSD (账本内的游戏筹码余额)
  const { data: wusdBalance, isLoading: isLoadingWusd, refetch: refetchWusd } = useReadContract({
    address: addresses.unifiedLedger,
    abi: UNIFIED_LEDGER_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address && !!addresses,
      refetchInterval: 30000,
    },
  });

  const formattedWusd = wusdBalance ? (Number(wusdBalance) / 1e6).toFixed(2) : "0.00";

  // 划转去游戏：充值流程
  const deposit = async (amount: number) => {
    if (!kernelClient || !address || !publicClient || !addresses) {
      toast.error("请先登录智能钱包且初始化完全");
      return;
    }
    
    setIsDepositing(true);
    try {
      // 1. 检查 Allowance
      const rawAmount = BigInt(amount * 1e6); // mUSDC 是 6 位小数
      
      const allowance = await publicClient.readContract({
        address: addresses.mUSDC,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, addresses.stablecoinReserve],
      }) as bigint;

      // 2. 申请风控授权 (API) (API 可以先调用，不依赖 on-chain approve 状态)
      console.log("Fetching authorization from API...");
      
      // 请求三方彩票 API 申请充值风控授权
      const auth = await apiClient.post("/deposit-authorizations", {
        userAddress: address,
        token: addresses.mUSDC,
        amount: rawAmount.toString(),
      }, {
        apiType: "lottery",
      });

      // 3. 构建批量交易 (Batch Transactions)
      const calls: any[] = [];
      
      if (allowance < rawAmount) {
        console.log("Need to Approve mUSDC to Reserve...");
        const approveCallData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [addresses.stablecoinReserve, rawAmount],
        });
        calls.push({
          to: addresses.mUSDC,
          data: approveCallData,
          value: 0n,
        });
      }

      console.log("Adding deposit tx to batch...");
      const depositCallData = encodeFunctionData({
        abi: STABLECOIN_RESERVE_ABI,
        functionName: 'deposit',
        args: [
          addresses.mUSDC,
          rawAmount,
          BigInt(auth.amount),
          rawAmount, // minWusdOut (假定1:1无滑点)
          BigInt(auth.deadline),
          BigInt(auth.nonce),
          auth.signature
        ],
      });
      calls.push({
        to: addresses.stablecoinReserve,
        data: depositCallData,
        value: 0n,
      });

      let depositTxHash: string;

      // 4. 发送打包交易
      if (calls.length === 1) {
        // 如果只有一笔（无需 approve），直接走 sendTransaction
        depositTxHash = await kernelClient.sendTransaction(calls[0]);
        console.log("Deposit Tx Hash (Single):", depositTxHash);
        await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
      } else {
        // 如果有多笔，通过 sendUserOperation 打包（ZeroDev 会合并为一个 UserOp）
        console.log("Sending batched transactions via sendUserOperation...");
        // @ts-ignore
        const userOpHash = await kernelClient.sendUserOperation({
          calls
        });
        console.log("Batched UserOp Hash:", userOpHash);
        toast.success("充值交易已打包发送，正在等待确认...");
        // @ts-ignore
        const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
        depositTxHash = receipt.receipt.transactionHash;
        console.log("Batched Tx Hash:", depositTxHash);
      }
      
      toast.success("充值成功! TxHash: " + depositTxHash);
      
      // 刷新余额
      refetchWusd();
    } catch (e: any) {
      console.error("[Deposit Error]", e);
      const parsed = parseWeb3Error(e, [STABLECOIN_RESERVE_ABI, UNIFIED_LEDGER_ABI, ERC20_ABI]);
      if (parsed.kind === "user_rejected") {
        toast.info(parsed.message);
        return;
      }
      toast.error(parsed.message);
    } finally {
      setIsDepositing(false);
    }
  };

  // 划转回平台：提现流程
  const withdraw = async (wusdAmount: number) => {
    if (!kernelClient || !address || !addresses || !publicClient) {
      toast.error("请先登录智能钱包");
      return;
    }
    
    setIsWithdrawing(true);
    try {
      const rawWusdAmount = BigInt(wusdAmount * 1e6); // WUSD 是 6 位小数
      
      const withdrawCallData = encodeFunctionData({
        abi: STABLECOIN_RESERVE_ABI,
        functionName: 'withdraw',
        args: [
          addresses.mUSDC,
          rawWusdAmount,
          rawWusdAmount, // minTokenOut
          address // recipient
        ],
      });

      const withdrawTxHash = await kernelClient.sendTransaction({
        to: addresses.stablecoinReserve,
        data: withdrawCallData,
        value: 0n,
      });

      console.log("Withdraw Tx Hash:", withdrawTxHash);
      toast.success("提现操作已提交! TxHash: " + withdrawTxHash);
      
      await publicClient.waitForTransactionReceipt({ hash: withdrawTxHash });
      refetchWusd();
    } catch (e: any) {
      console.error("[Withdraw Error]", e);
      const parsed = parseWeb3Error(e, [STABLECOIN_RESERVE_ABI, UNIFIED_LEDGER_ABI, ERC20_ABI]);
      if (parsed.kind === "user_rejected") {
        toast.info(parsed.message);
        return;
      }
      toast.error(parsed.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    wusdBalance: {
      data: wusdBalance,
      isLoading: isLoadingWusd,
      formatted: formattedWusd,
    },
    refetchWusd,
    deposit,
    isDepositing,
    withdraw,
    isWithdrawing
  };
}
