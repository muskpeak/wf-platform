"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useVaultDeposit } from "../../hooks/useVaultDeposit";
import { VaultModal } from "../shared/VaultModal";
import { VaultDepositForm } from "./VaultDepositForm";
import { VaultDepositResult } from "./VaultDepositResult";

export function VaultDepositModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const r = useVaultDeposit(open, () => {
    onSuccess?.();
    onOpenChange(false);
  });

  // 每次打开弹窗时，重置状态
  useEffect(() => {
    if (open) {
      r.initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const header = (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800/80 px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        {r.quoteData && (
          <button
            type="button"
            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer mr-1"
            onClick={r.clearQuote}
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2
          id="relay-deposit-title"
          className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate"
        >
          {r.quoteData ? "充值详情与转账" : "充值 USDC"}
        </h2>
      </div>
    </header>
  );


  return (
    <VaultModal
      open={open}
      onOpenChange={onOpenChange}
      header={header}
      maxWidth="480px"
    >
      <div className="flex flex-col">
        {!r.quoteData ? (
          <VaultDepositForm r={r} />
        ) : (
          <VaultDepositResult r={r} />
        )}
      </div>
    </VaultModal>
  );
}

