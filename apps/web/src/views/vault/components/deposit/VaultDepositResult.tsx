"use client";

import { ChevronDown, Copy } from "lucide-react";
import { cn } from "../shared/cn";
import { TokenImg } from "../shared/TokenImg";
import type { useVaultDeposit } from "../../hooks/useVaultDeposit";
import { USDC_SYMBOL } from "../../config/vault.config";

type R = ReturnType<typeof useVaultDeposit>;

function formatQuoteRate(rate: string | number): string {
  const n = typeof rate === "number" ? rate : Number(rate);
  if (!Number.isFinite(n)) return String(rate);
  const opts: Intl.NumberFormatOptions =
    Math.abs(n) >= 1000
      ? { maximumFractionDigits: 2 }
      : { maximumFractionDigits: 6 };
  return n.toLocaleString(undefined, opts);
}

export function VaultDepositResult({ r }: { r: R }) {
  const {
    originChainObj,
    selectedOriginTok,
    qrDataUrl,
    depositAddress,
    copyDeposit,
    details: d,
    priceImpactOpen,
    setPriceImpactOpen,
  } = r;

  return (
    <div className="space-y-4">
      {/* 来源网络与代币徽章 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-h-[50px] items-center gap-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] px-3.5 py-2">
          <TokenImg
            src={originChainObj?.iconUrl}
            className="h-7 w-7 shrink-0 rounded-full bg-white dark:bg-gray-800 object-contain ring-1 ring-gray-200 dark:ring-gray-700"
          />
          <div className="min-w-0">
            <div className="text-[0.68rem] font-medium text-gray-400">
              来源网络
            </div>
            <div className="truncate text-xs font-bold text-gray-900 dark:text-white">
              {originChainObj
                ? originChainObj.displayName || originChainObj.name
                : "—"}
            </div>
          </div>
        </div>
        <div className="flex min-h-[50px] items-center gap-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] px-3.5 py-2">
          <TokenImg
            src={selectedOriginTok?.logoURI ?? undefined}
            className="h-7 w-7 shrink-0 rounded-full bg-white dark:bg-gray-800 object-contain ring-1 ring-gray-200 dark:ring-gray-700"
          />
          <div className="min-w-0">
            <div className="text-[0.68rem] font-medium text-gray-400">
              充值代币
            </div>
            <div className="truncate text-xs font-bold text-gray-900 dark:text-white">
              {selectedOriginTok?.symbol || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* 二维码与专属充值地址卡片 */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] p-4 sm:p-5 flex flex-col items-center">
        {/* 二维码展示区 */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white p-3 shadow-sm mb-4">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="充值二维码"
              width={160}
              height={160}
              className="mx-auto block h-[150px] w-[150px] sm:h-[160px] sm:w-[160px]"
            />
          ) : (
            <div className="flex h-[150px] w-[150px] items-center justify-center text-center text-xs text-gray-400">
              二维码加载中...
            </div>
          )}
        </div>

        {/* 专属充值地址与复制 */}
        <div className="w-full space-y-3">
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {r.isSameChain ? "资金账户充值地址 (Polygon)" : "专属充值中转地址"}
              </span>
              <span className="text-[0.68rem] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                自动监听入账
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171E] py-2 pl-3.5 pr-1.5 shadow-sm">
              <div className="min-w-0 flex-1 break-all font-mono text-xs font-medium text-gray-800 dark:text-gray-200 select-all">
                {depositAddress}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white p-2.5 transition active:scale-95 cursor-pointer shadow-sm"
                onClick={() => void copyDeposit()}
                aria-label="复制地址"
                title="复制地址"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {originChainObj?.featuredTokens?.[0]?.minAmount &&
            Number(originChainObj.featuredTokens[0].minAmount) > 0 && (
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                最低充值额度: {originChainObj.featuredTokens[0].minAmount} {USDC_SYMBOL}
              </div>
            )}

          <div className="rounded-xl bg-[#EEF4FF] dark:bg-[#0066FF]/10 border border-[#0066FF]/20 px-3.5 py-2 text-[0.72rem] text-gray-600 dark:text-gray-300 leading-relaxed">
            {r.isSameChain
              ? "此地址为您在 Polygon 上的专属 AA 资金账户地址。请向此地址转入 Polygon USDC，转账上链后即时入账。"
              : "向此专属中转地址转账后，Relay 协议将自动完成跨链结算并充入您的 Polygon 资金账户。"}
          </div>
        </div>
      </div>

      {/* 参考汇率 */}
      {d?.rate != null ? (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] px-3.5 py-2.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>参考汇率</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              1{" "}
              {d.currencyIn?.currency?.symbol ??
                selectedOriginTok?.symbol ??
                "—"}{" "}
              ≈ {formatQuoteRate(d.rate)}{" "}
              {d.currencyOut?.currency?.symbol ?? ""}
            </span>
          </p>
        </div>
      ) : null}

      {/* 价格影响与交易详情折叠 */}
      {d?.totalImpact?.percent != null && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            onClick={() => setPriceImpactOpen((o) => !o)}
          >
            <span className="font-medium text-gray-500 dark:text-gray-400">
              价格影响 / 滑点
            </span>
            <span className="flex items-center gap-1.5 font-bold font-mono text-gray-900 dark:text-white">
              {Math.abs(Number(d.totalImpact.percent))}%
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                  priceImpactOpen && "rotate-180"
                )}
              />
            </span>
          </button>

          {priceImpactOpen && (
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 px-4 py-3 text-xs bg-white/50 dark:bg-black/20">
              {d?.slippageTolerance?.destination?.percent != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">最大滑点容忍度</span>
                  <span className="font-semibold font-mono text-gray-800 dark:text-gray-200">
                    {d.slippageTolerance.destination.percent}%
                  </span>
                </div>
              )}
              {d?.timeEstimate != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">预计到账耗时</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {d.timeEstimate > 60
                      ? `约 ${Math.ceil(d.timeEstimate / 60)} 分钟`
                      : `${d.timeEstimate} 秒`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

