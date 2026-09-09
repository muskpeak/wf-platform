"use client";

import { useState, useCallback } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { ClobClient, Chain, OrderType, Side } from "@polymarket/clob-client-v2";
import { ethers } from "ethers";
import { POLYMARKET_CONFIG } from "../config";
import { ZeroDevSigner } from "./ZeroDevSigner";

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  }
];

// Simple ABI for redeemPositions on CTF
const CTF_ABI = [
  {
    type: "function",
    name: "redeemPositions",
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "indexSets", type: "uint256[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable",
  }
];

// ABI for minting Test USDC
const MINT_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  }
];

// Removed ClobOrderSigner. We MUST use the Root Validator (eoaClient) to sign Polymarket orders.
// Polymarket's backend STRICTLY expects a 65-byte inner signature to extract the signer address
// and match it against the API Key owner. Kernel v3's Session Key requires an 86-byte signature,
// which causes Polymarket's backend to fail ecrecover and reject the order.
// Therefore, we must use the EOA (Root Validator) directly, which produces a 65-byte signature
// that Kernel v3 accepts via its rootValidator fallback.

export function usePolyMarket(sessionClient: any, kernelClient: any, eoaClient: any, aaAddress: string, depositWalletAddress?: string, rpcUrl?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [polyLogs, setPolyLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setPolyLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // 1. Approve USDC for Polymarket CTF Exchange
  const approveUSDC = useCallback(async (amount: string) => {
    if (!sessionClient) return;
    setIsProcessing(true);
    addLog(`开始授权 Polymarket 扣款: ${amount} USDC...`);
    try {
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [POLYMARKET_CONFIG.CTF_EXCHANGE_ADDRESS as `0x${string}`, parseUnits(amount, 6)],
      });

      const tx = await sessionClient.sendTransaction({
        to: POLYMARKET_CONFIG.USDC_ADDRESS as `0x${string}`,
        value: BigInt(0),
        data,
      });
      addLog(`✅ 授权成功! Tx Hash: ${tx}`);
    } catch (e: any) {
      addLog(`❌ 授权失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionClient]);

  // 1.5 Mint Test USDC (If the contract supports it)
  const mintTestUSDC = useCallback(async (amount: string) => {
    if (!sessionClient || !aaAddress) return;
    setIsProcessing(true);
    addLog(`尝试在测试网铸造 ${amount} Test USDC...`);
    try {
      const data = encodeFunctionData({
        abi: MINT_ABI,
        functionName: "mint",
        args: [aaAddress as `0x${string}`, parseUnits(amount, 6)],
      });

      const tx = await sessionClient.sendTransaction({
        to: POLYMARKET_CONFIG.USDC_ADDRESS as `0x${string}`,
        value: BigInt(0),
        data,
      });
      addLog(`✅ 领水成功! Tx Hash: ${tx}`);
    } catch (e: any) {
      addLog(`❌ 领水失败 (可能该合约不支持公开 mint): ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionClient, aaAddress]);

  // 2. Place Order on CLOB using Session Key EIP-1271 Signature
  const placeOrder = useCallback(async (tokenId: string, price: number, size: number, side: Side) => {
    if (!sessionClient || !aaAddress) return;
    setIsProcessing(true);
    addLog("初始化 Polymarket ClobClient，使用 ZeroDev EIP-1271 签名器...");
    try {
      // 从 localStorage 中读取预先签好并保存的 API Key
      const storedKeysRaw = localStorage.getItem(`poly_api_keys_${aaAddress}`);
      if (!storedKeysRaw) {
        throw new Error("找不到 API 密钥，请先点击【激活交易权限】");
      }
      const creds = JSON.parse(storedKeysRaw);
      
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl || "https://polygon.llamarpc.com");
      
      
      const clobClient = new ClobClient({
        host: POLYMARKET_CONFIG.HOST,
        chain: POLYMARKET_CONFIG.CHAIN_ID as Chain,
        signer: eoaClient, // Must use the EOA to produce exactly 65 bytes
        creds: creds,
        funderAddress: depositWalletAddress || aaAddress, // Use Deposit Wallet if available
        signatureType: 3 // POLY_1271
      });

      addLog(`构建订单: ${side === Side.BUY ? "买入" : "卖出"} ${size} 份, 价格 ${price}...`);
      const resp = await clobClient.createAndPostOrder(
        {
          tokenID: tokenId,
          price,
          side,
          size,
        },
        { tickSize: "0.01" }, // Amoy tick size might vary, normally 0.01
        OrderType.GTC
      );
      addLog(`✅ 下单成功! 订单响应: ${JSON.stringify(resp)}`);
      return resp;
    } catch (e: any) {
      addLog(`❌ 下单失败: ${e.message || String(e)}`);
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionClient, aaAddress]);

  // 3. Redeem Positions
  const redeemPositions = useCallback(async (conditionId: string) => {
    if (!sessionClient) return;
    setIsProcessing(true);
    addLog(`调用链上结算合约，提取 conditionId: ${conditionId.slice(0,6)}... 份额收益...`);
    try {
      const data = encodeFunctionData({
        abi: CTF_ABI,
        functionName: "redeemPositions",
        args: [
          POLYMARKET_CONFIG.USDC_ADDRESS,
          "0x0000000000000000000000000000000000000000000000000000000000000000", // HashZero
          conditionId,
          [BigInt(1), BigInt(2)] // Typically index sets for binary markets
        ],
      });

      const tx = await sessionClient.sendTransaction({
        to: POLYMARKET_CONFIG.CONDITIONAL_TOKENS_ADDRESS as `0x${string}`,
        value: BigInt(0),
        data,
      });
      addLog(`✅ 结算请求已上链! 等待打包... Tx Hash: ${tx}`);
    } catch (e: any) {
      addLog(`❌ 结算失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionClient]);

  return {
    approveUSDC,
    mintTestUSDC,
    placeOrder,
    redeemPositions,
    isProcessing,
    polyLogs
  };
}
