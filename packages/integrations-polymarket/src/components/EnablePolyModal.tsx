import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { encodeFunctionData } from "viem";
import { ClobClient, Chain } from "@polymarket/clob-client-v2";
import { POLYMARKET_CONFIG } from "../config";
import { useDepositWallet } from "../hooks/useDepositWallet";

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  }
];

interface EnablePolyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kernelClient: any;
  eoaClient: any;
  aaAddress: string;
  depositWalletAddress: string;
  rpcUrl?: string;
}

export function EnablePolyModal({ isOpen, onClose, onSuccess, kernelClient, eoaClient, aaAddress, depositWalletAddress, rpcUrl }: EnablePolyModalProps) {
  const [step, setStep] = useState<"checking" | "idle" | "deploying" | "approving" | "generating" | "done">("checking");
  const [error, setError] = useState<string | null>(null);
  
  const [needsDeploy, setNeedsDeploy] = useState(true);
  const [needsApprove, setNeedsApprove] = useState(true);
  
  const { deployDepositWallet, approveDepositWallet } = useDepositWallet();

  // Check if already approved and if API key exists
  useEffect(() => {
    if (!isOpen) {
      setStep("checking");
      setError(null);
      return;
    }

    const checkStatus = async () => {
      try {
        setStep("checking");
        const storedKeys = localStorage.getItem(`poly_api_keys_${aaAddress}`);
        
        let walletDeployed = false;
        let hasAllowance = false;

        // Check if wallet is deployed (we'll just assume it's deployed if it has allowance, or try to check)
        // For POC, we'll check allowance
        if (depositWalletAddress) {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl || "https://polygon.llamarpc.com");
          const usdcContract = new ethers.Contract(POLYMARKET_CONFIG.USDC_ADDRESS, ERC20_ABI, provider);
          
          try {
            const allowance: ethers.BigNumber = await usdcContract.allowance(depositWalletAddress, POLYMARKET_CONFIG.CTF_EXCHANGE_ADDRESS);
            hasAllowance = allowance.gt(0); 
            if (hasAllowance) {
               walletDeployed = true;
            }
          } catch(e) {
            console.log("Error checking allowance, assuming not deployed", e);
          }
        }
        
        setNeedsApprove(!hasAllowance);
        // For simplicity in this POC, if it has allowance, it is deployed. Otherwise we force deploy step.
        setNeedsDeploy(!walletDeployed);

        if (hasAllowance && storedKeys) {
          setStep("done");
          setTimeout(() => onSuccess(), 500);
        } else {
          setStep("idle");
        }
      } catch (err: any) {
        console.error("Failed to check status:", err);
        setError("无法检查账户状态: " + err.message);
        setStep("idle");
      }
    };

    checkStatus();
  }, [isOpen, aaAddress, depositWalletAddress, rpcUrl, onSuccess]);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    setError(null);
    setStep("deploying");
    try {
      const res = await deployDepositWallet(eoaClient);
      console.log("Deploy Deposit Wallet Result:", res);
      setNeedsDeploy(false);
      setStep("idle");
    } catch (err: any) {
      console.error(err);
      setError("部署钱包失败: " + (err.message || String(err)));
      setStep("idle");
    }
  };

  const handleApprove = async () => {
    setError(null);
    setStep("approving");
    try {
      const res = await approveDepositWallet(eoaClient, depositWalletAddress);
      console.log("Approve Deposit Wallet Result:", res);
      setNeedsApprove(false);
      setStep("idle");
    } catch (err: any) {
      console.error(err);
      setError("授权资金失败: " + (err.message || String(err)));
      setStep("idle");
    }
  };

  const handleGenerateKey = async () => {
    setError(null);
    setStep("generating");
    try {
      const authClient = new ClobClient({
        host: POLYMARKET_CONFIG.HOST,
        chain: POLYMARKET_CONFIG.CHAIN_ID as Chain,
        signer: eoaClient, // Use EOA for generating API Keys!
        funderAddress: depositWalletAddress || aaAddress, // Deposit wallet is the funder
        signatureType: 3 // POLY_1271
      });

      let creds = await authClient.deriveApiKey();
      
      if (!creds || !creds.key) {
        console.log("Derive API Key 失败，可能是新用户，尝试 Create:", creds);
        creds = await authClient.createApiKey();
      }
      
      if (!creds || !creds.key || !creds.secret || !creds.passphrase) {
        throw new Error(`API Key 生成失败 (${JSON.stringify(creds)})，请重试。`);
      }

      localStorage.setItem(`poly_api_keys_${aaAddress}`, JSON.stringify(creds));
      
      setStep("done");
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      console.error(err);
      setError("生成 API 密钥失败: " + (err.message || String(err)));
      setStep("idle");
    }
  };

  const hasStoredKey = !!localStorage.getItem(`poly_api_keys_${aaAddress}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            激活 Polymarket 交易权限
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            根据 Polymarket 官方要求，您需要部署一个专属的 Deposit Wallet。
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 break-all">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            {/* Step 1: Deploy */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">1. 部署官方 Deposit Wallet</h3>
                <p className="text-xs text-gray-500 mt-1">免 Gas 费由 Polymarket 官方 Relayer 代付</p>
              </div>
              {!needsDeploy ? (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold">
                  已完成
                </div>
              ) : (
                <button
                  onClick={handleDeploy}
                  disabled={step !== "idle"}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {step === "deploying" ? "部署中..." : "一键部署"}
                </button>
              )}
            </div>

            {/* Step 2: Approve */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">2. 授权交易资金</h3>
                <p className="text-xs text-gray-500 mt-1">授权 Deposit Wallet 可用 USDC</p>
              </div>
              {!needsApprove ? (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold">
                  已完成
                </div>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={step !== "idle" || needsDeploy}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    step !== "idle" || needsDeploy
                      ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {step === "approving" ? "授权中..." : "一键授权"}
                </button>
              )}
            </div>

            {/* Step 3: Generate Key */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">3. 生成交易凭证</h3>
                <p className="text-xs text-gray-500 mt-1">签署文本证明身份 (免 Gas 费)</p>
              </div>
              {hasStoredKey ? (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold">
                  已完成
                </div>
              ) : (
                <button
                  onClick={handleGenerateKey}
                  disabled={step !== "idle" || needsApprove || needsDeploy} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    step !== "idle" || needsApprove || needsDeploy
                      ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {step === "generating" ? "签名中..." : "点击签名"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            disabled={step !== "idle" && step !== "done"}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
          >
            取消下注
          </button>
        </div>
      </div>
    </div>
  );
}
