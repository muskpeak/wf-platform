"use client";

import { useVaultWithdraw } from "../../hooks/useVaultWithdraw";
import { VaultModal } from "../shared/VaultModal";
import { USDC_SYMBOL } from "../../config/vault.config";
import { VaultWithdrawForm } from "./VaultWithdrawForm";
import { VaultWithdrawSuccess } from "./VaultWithdrawSuccess";

export function VaultWithdrawModal({
  open,
  onOpenChange,
  balance = "0",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: string;
}) {
  const r = useVaultWithdraw(open, balance);
  const header = (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800/80 px-4 py-3.5 sm:px-6">
      <h2
        id="relay-withdraw-title"
        className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate"
      >
        {r.isSuccess ? "提现成功" : `跨链提现 ${USDC_SYMBOL}`}
      </h2>
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
        {r.isSuccess ? (
          <VaultWithdrawSuccess r={r} onDone={() => onOpenChange(false)} />
        ) : (
          <VaultWithdrawForm r={r} />
        )}
      </div>
    </VaultModal>
  );
}

