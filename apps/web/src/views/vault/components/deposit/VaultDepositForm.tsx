"use client";

import { useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "../shared/cn";
import { USDC_SYMBOL, ZERO_ADDRESS } from "../../config/vault.config";
import { VaultCustomSelect, type VaultCustomSelectOption } from "../shared/VaultCustomSelect";
import type { useVaultDeposit } from "../../hooks/useVaultDeposit";

type R = ReturnType<typeof useVaultDeposit>;

export function VaultDepositForm({ r }: { r: R }) {
  const {
    chains,
    chainsError,
    originChainsList,
    originChainId,
    updateOriginChain,
    originCurrency,
    setOriginCurrency,
    originTokens,
    originChainObj,
    selectedOriginTok,
    ackRisk,
    setAckRisk,
    quoteLoading,
    quoteStatus,
    postQuote,
    canQuote,
  } = r;

  const chainsLoading = chains.length === 0 && !chainsError;

  // 网络下拉选项
  const chainOptions: VaultCustomSelectOption[] = useMemo(() => {
    return originChainsList.map((c) => {
      const tokenMin = c.featuredTokens?.[0]?.minAmount;
      return {
        value: String(c.id),
        label: c.displayName || c.name || `Chain ${c.id}`,
        logoUrl: c.iconUrl,
        rightMeta: tokenMin ? `最低 ${tokenMin} ${USDC_SYMBOL}` : undefined,
      };
    });
  }, [originChainsList]);

  // 代币下拉选项：展示合约地址缩写（网络已有最低充值显示）
  const tokenOptions: VaultCustomSelectOption[] = useMemo(() => {
    return originTokens.map((tok) => {
      const addr = tok.address;
      const isNative =
        !addr ||
        addr === ZERO_ADDRESS ||
        addr.toLowerCase() === "0x0000000000000000000000000000000000000000";
      const displayAddr = isNative
        ? "原生代币"
        : `${addr.slice(0, 6)}...${addr.slice(-4)}`;

      return {
        value: tok.address || "",
        label: tok.symbol || "Token",
        logoUrl: tok.logoURI,
        rightMeta: displayAddr,
      };
    });
  }, [originTokens]);

  const originChainLabel =
    originChainObj?.displayName || originChainObj?.name || "所选网络";
  const originTokenLabel = selectedOriginTok?.symbol || "代币";

  return (
    <div className="space-y-4">
      {/* 来源网络与币种选择区域 (采用与划转一致的精致卡片设计) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 来源网络选择 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400 px-0.5">
            来源网络
          </label>
          <VaultCustomSelect
            options={chainOptions}
            value={originChainId}
            onChange={(next) => updateOriginChain(next)}
            placeholder="选择充值网络"
            loading={chainsLoading}
          />
        </div>

        {/* 充值代币选择 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400 px-0.5">
            充值代币
          </label>
          <VaultCustomSelect
            options={tokenOptions}
            value={originCurrency}
            onChange={(next) => setOriginCurrency(next)}
            placeholder="选择充值代币"
            disabled={!originChainId || originTokens.length === 0}
          />
        </div>
      </div>

      {/* 结算入账账户卡片 (参考划转设计规范：纯净大字、无下拉箭头) */}
      <div className="rounded-[18px] border border-[#E5E8F0] dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#6B7280] dark:text-gray-400">
            结算账户 (Deposit To)
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
            结算币种
          </span>
          <span className="text-[15px] font-bold text-[#0066FF] dark:text-[#3B82F6] font-mono">
            {USDC_SYMBOL}
          </span>
        </div>
      </div>

      {/* 充值安全提示卡片 (划转高质感提醒框) */}
      <div className="rounded-[18px] border border-amber-200/80 dark:border-amber-900/40 bg-[#FFFDF5] dark:bg-[#1E1C16] p-3.5 sm:p-4">
        <div className="flex items-center gap-2 mb-1.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold tracking-wide">
            充值安全须知
          </span>
        </div>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          {r.isSameChain ? (
            <>
              您正在充值 <strong className="text-gray-900 dark:text-white font-semibold">Polygon</strong> 上的 <strong className="text-[#0066FF] dark:text-[#3B82F6] font-semibold">USDC</strong>（同网络同币种），<strong className="text-emerald-600 dark:text-emerald-400 font-semibold">免跨链直接充值</strong>。生成地址后直接转入即可即时到账。
            </>
          ) : (
            <>
              生成的专属充值地址仅接收{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                {originChainLabel}
              </strong>{" "}
              上的{" "}
              <strong className="text-[#0066FF] dark:text-[#3B82F6] font-semibold">
                {originTokenLabel}
              </strong>
              。转入其他未支持资产或错误网络将无法找回。
            </>
          )}
        </p>

        <label className="mt-3 pt-2.5 border-t border-amber-200/50 dark:border-amber-900/30 flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-200 select-none">
          <input
            type="checkbox"
            checked={ackRisk}
            onChange={(e) => setAckRisk(e.target.checked)}
            className="size-4 shrink-0 cursor-pointer rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF]/20 accent-[#0066FF]"
          />
          <span>我已核对来源网络和币种并已知悉充值规则</span>
        </label>
      </div>

      {/* 提交按钮 (对标划转全圆角大按钮) */}
      <button
        type="button"
        className="w-full h-[48px] rounded-[30px] bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-semibold text-[15px] shadow-[0_4px_12px_rgba(0,102,255,0.25)] flex items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer"
        disabled={!canQuote}
        onClick={() => void postQuote()}
      >
        {quoteLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在生成专属充值地址...
          </>
        ) : (
          "获取充值地址"
        )}
      </button>

      {/* 协议与到账说明 */}
      <div className="rounded-[14px] bg-[#FAFBFD] dark:bg-[#1A1E26] border border-[#E5E8F0] dark:border-gray-800/80 px-3.5 py-2 text-center text-[11px] text-[#6B7280] dark:text-gray-400 leading-relaxed">
        {r.isSameChain
          ? "Polygon 本链充值：转账将直接充入您的 AA 资金账户"
          : "跨链充值资金通过中继协议自动清算为 Polygon USDC 并计入您的资金账户"}
      </div>

      {quoteStatus.msg ? (
        <p
          className={cn(
            "text-center text-xs font-medium",
            quoteStatus.err ? "text-red-500" : "text-gray-500"
          )}
        >
          {quoteStatus.msg}
        </p>
      ) : null}
    </div>
  );
}
