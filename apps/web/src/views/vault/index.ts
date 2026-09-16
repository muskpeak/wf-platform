/**
 * Vault View Module Exports
 * 统一对外导出充值弹窗、提现弹窗、Hooks 以及服务接口
 */

export { VaultDepositModal } from "./components/deposit/VaultDepositModal";
export { VaultWithdrawModal } from "./components/withdraw/VaultWithdrawModal";

export { useVaultDeposit } from "./hooks/useVaultDeposit";
export { useVaultWithdraw } from "./hooks/useVaultWithdraw";

export { vaultService } from "./services/vault.service";
export type * from "./services/vault.types";
export * from "./config/vault.config";
