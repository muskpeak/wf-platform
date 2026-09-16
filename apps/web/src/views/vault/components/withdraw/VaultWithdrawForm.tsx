"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../shared/cn";
import { USDC_SYMBOL } from "../../config/vault.config";
import { VaultCustomSelect, type VaultCustomSelectOption } from "../shared/VaultCustomSelect";
import { AddressInput } from "../shared/AddressInput";
import type { useVaultWithdraw } from "../../hooks/useVaultWithdraw";

type R = ReturnType<typeof useVaultWithdraw>;

export function VaultWithdrawForm({ r }: { r: R }) {
  const {
    vaultBalanceRaw,
    destinationChains,
    destinationChainId,
    setDestinationChainId,
    destTokens,
    destinationCurrency,
    setDestinationCurrency,
    recipient,
    setRecipient,
    recipientErr,
    amountInput,
    setAmountInput,
    quoteStatus,
    quoteData,
    quoteLoading,
    executeQuote,
    executeLoading,
    canQuote,
    isInsufficientBalance,
    minAmountErr,
    withdrawAsset,
  } = r;

  const selectedDestTok = destTokens.find(
    (t) => (t.address || "").toLowerCase() === (destinationCurrency || "").toLowerCase()
  );

  const handleSubmitClick = () => {
    void executeQuote();
  };

  const d = quoteData?.details;
  const inSym = d?.currencyIn?.currency?.symbol || USDC_SYMBOL;
  const outSym = d?.currencyOut?.currency?.symbol || USDC_SYMBOL;

  const onMaxAmount = () => {
    const v = vaultBalanceRaw?.trim() || "0";
    if (v && v !== "0" && Number(v) > 0) setAmountInput(v);
  };

  // 目标网络下拉选项
  const chainOptions: VaultCustomSelectOption[] = useMemo(() => {
    return destinationChains.map((c) => ({
      value: String(c.id),
      label: c.displayName || c.name || `Chain ${c.id}`,
      logoUrl: c.iconUrl,
      rightMeta: `Chain ID: ${c.id}`,
    }));
  }, [destinationChains]);

  // 接收代币下拉选项
  const tokenOptions: VaultCustomSelectOption[] = useMemo(() => {
    return destTokens.map((tok) => ({
      value: tok.address || "",
      label: tok.symbol || "Token",
      logoUrl: tok.logoURI,
      rightMeta: tok.minAmount ? `最低 ${tok.minAmount} ${tok.symbol || ""}` : undefined,
    }));
  }, [destTokens]);

  return (
    <div className="space-y-4">
      {/* 转出源账户卡片 (参考划转账户卡片规范) */}
      <div className="rounded-[18px] border border-[#E5E8F0] dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#6B7280] dark:text-gray-400">
            出金账户 (Withdraw From)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-[#1C1F23] dark:text-white truncate">
              WF 资金账户
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF4FF] text-[#0066FF] dark:bg-[#0066FF]/20 dark:text-[#3B82F6]">
              Polygon 网络
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 block">
            可用余额
          </span>
          <span className="text-[14px] font-bold text-[#1C1F23] dark:text-white font-mono">
            {vaultBalanceRaw || "0.00"} {withdrawAsset}
          </span>
        </div>
      </div>

      {/* 提现目标网络与代币 (双选择卡片) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400 px-0.5">
            提现目标网络
          </label>
          <VaultCustomSelect
            options={chainOptions}
            value={destinationChainId}
            onChange={(next) => setDestinationChainId(next)}
            placeholder="选择目标网络"
            loading={destinationChains.length === 0}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400 px-0.5">
            接收币种
          </label>
          <VaultCustomSelect
            options={tokenOptions}
            value={destinationCurrency}
            onChange={(next) => setDestinationCurrency(next)}
            placeholder="选择接收币种"
            disabled={!destinationChainId || destTokens.length === 0}
          />
        </div>
      </div>

      {/* 接收地址输入卡片 */}
      <AddressInput
        label="接收钱包地址 (Recipient Address)"
        value={recipient}
        onChange={setRecipient}
        isError={!!recipientErr}
        errorText={recipientErr}
      />

      {/* 提现金额卡片 (100% 对齐图三划转设计) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400">
            提现金额
          </span>
          <button
            type="button"
            onClick={onMaxAmount}
            className="text-[11px] text-[#6B7280] dark:text-gray-400 hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            可用: <span className="font-mono font-bold text-[#1C1F23] dark:text-gray-200">{vaultBalanceRaw || "0.00"}</span>
          </button>
        </div>

        <div
          className={cn(
            "w-full h-[48px] bg-white dark:bg-[#1A1E26] rounded-[16px] border flex items-center px-3.5 transition-all duration-150 justify-between",
            isInsufficientBalance
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/15"
              : "border-[#E5E8F0] dark:border-gray-800 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15"
          )}
        >
          {/* 左侧大字号金额输入 */}
          <input
            type="text"
            className="w-full flex-1 text-left text-[#1C1F23] dark:text-white text-[18px] font-bold font-mono bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 p-0"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              const parts = val.split(".");
              if (parts.length > 2) return;
              const maxDecimals = 6;
              if (parts[1] && parts[1].length > maxDecimals) return;
              if (val && parseFloat(val) > 1000000) return;
              setAmountInput(val);
            }}
          />

          {/* 右侧 MAX 胶囊与币种 (对标图三划转) */}
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={onMaxAmount}
              className="bg-[#EEF4FF] hover:bg-blue-100 dark:bg-[#0066FF]/20 dark:hover:bg-[#0066FF]/30 text-[#0066FF] dark:text-[#3B82F6] rounded-[8px] px-2.5 py-1 text-[12px] font-semibold transition active:scale-95 cursor-pointer"
            >
              MAX
            </button>
            <span className="text-[14px] font-semibold text-[#4B525D] dark:text-gray-300">
              {withdrawAsset}
            </span>
          </div>
        </div>

        {/* 提示与报错 */}
        <div className="flex justify-between items-center px-1">
          <div className="flex-1">
            {isInsufficientBalance ? (
              <span className="text-xs font-medium text-red-500">
                资金余额不足
              </span>
            ) : minAmountErr ? (
              <span className="text-xs font-medium text-red-500">
                {minAmountErr}
              </span>
            ) : quoteStatus.msg && quoteStatus.err ? (
              <span className="text-xs font-medium text-red-500">
                {quoteStatus.msg}
              </span>
            ) : null}
          </div>
          {selectedDestTok?.minAmount && Number(selectedDestTok.minAmount) > 0 && (
            <span className="text-[11px] text-gray-400">
              最低: {selectedDestTok.minAmount} {withdrawAsset}
            </span>
          )}
        </div>
      </div>

      {/* 询价概览明细卡片 */}
      {quoteData && (
        <div className="rounded-[16px] border border-[#E5E8F0] dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">预计扣除资金账户</span>
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
              {d?.currencyIn?.amountFormatted ?? amountInput} {inSym}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">预计实际到账金额</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {d?.currencyOut?.amountFormatted ?? amountInput} {outSym}
            </span>
          </div>
          {d?.timeEstimate != null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">预计处理耗时</span>
              <span className="font-semibold text-[#0066FF] dark:text-[#3B82F6]">
                {d.timeEstimate > 60
                  ? `约 ${Math.ceil(d.timeEstimate / 60)} 分钟`
                  : `${d.timeEstimate} 秒`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 提交提现按钮 (对标图三划转大按钮) */}
      <button
        type="button"
        onClick={handleSubmitClick}
        disabled={!canQuote || quoteLoading || executeLoading || !quoteData}
        className="w-full h-[48px] rounded-[30px] bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-semibold text-[15px] shadow-[0_4px_12px_rgba(0,102,255,0.25)] flex items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer"
      >
        {quoteLoading || executeLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>
            {!r.embeddedAddress
              ? "请先连接钱包"
              : !canQuote
              ? "请完善提现信息"
              : quoteData
              ? "确认提现"
              : "输入中..."}
          </span>
        )}
      </button>

      {/* 提现说明 */}
      <div className="rounded-[14px] bg-[#FAFBFD] dark:bg-[#1A1E26] border border-[#E5E8F0] dark:border-gray-800/80 px-3.5 py-2 text-[11px] text-[#6B7280] dark:text-gray-400 leading-relaxed text-center">
        提现将通过跨链中继协议自动清算打款至目标地址，通常 1-5 分钟内到账
      </div>
    </div>
  );
}
