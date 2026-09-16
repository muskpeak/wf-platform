"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "@wf-platform/uikit";
import type { useVaultWithdraw } from "../../hooks/useVaultWithdraw";
import { USDC_SYMBOL } from "../../config/vault.config";

type R = ReturnType<typeof useVaultWithdraw>;

export function VaultWithdrawSuccess({
  r,
  onDone,
}: {
  r: R;
  onDone: () => void;
}) {
  const { submittedTxHashes, amountInput, destChainObj } = r;
  const [copied, setCopied] = useState(false);

  const receiveAmount = amountInput || "0";
  const txHash = submittedTxHashes[0];
  const explorerUrl = txHash ? `https://polygonscan.com/tx/${txHash}` : "#";
  const chainName = destChainObj?.displayName || destChainObj?.name || "Polygon";

  const handleCopy = () => {
    if (!r.recipient) return;
    navigator.clipboard.writeText(r.recipient);
    setCopied(true);
    toast.success("收款地址已复制");
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 py-1">
      {/* 成功状态图标与柔和光晕 */}
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 ring-8 ring-emerald-500/10">
        <Check className="size-7 text-emerald-500" strokeWidth={3} />
      </div>

      <h3 className="mb-1 text-sm font-semibold tracking-tight text-gray-500 dark:text-gray-400">
        提现请求已成功提交
      </h3>

      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
          {receiveAmount}
        </span>
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{USDC_SYMBOL}</span>
      </div>

      {/* 交易详情 */}
      <div className="w-full space-y-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] p-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">目标网络</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{chainName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">接收地址</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
              {truncateAddress(r.recipient)}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {txHash && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">交易哈希</span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-[#0066FF] hover:underline"
            >
              {truncateAddress(txHash)}
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-6 w-full min-h-[50px] rounded-2xl bg-[#0066FF] text-white font-bold text-sm shadow-md shadow-[#0066FF]/20 hover:bg-[#0052CC] transition active:scale-[0.98] cursor-pointer"
      >
        完成
      </button>
    </div>
  );
}

