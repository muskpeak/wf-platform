/**
 * Vault Module Configuration & Constants
 * 针对 Polygon (Chain ID: 137) 与 USDC 资产优化
 */

export const CHAIN_ID = 137;
export const USDC_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  process.env.USDC_ADDRESS ||
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export const USDC_SYMBOL = "USDC";
export const USDC_DECIMALS = 6;

/**
 * Canonical Zero Address.
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * The human-readable base amount used for quoting.
 */
export const QUOTE_BASE_AMOUNT_READABLE = "1";

// --- Shared UI Style Classes ---
export const VAULT_STYLE = {
  CARD: "overflow-hidden rounded-[24px] bg-white dark:bg-[#16181F] text-gray-900 dark:text-white shadow-xl border border-gray-100 dark:border-gray-800",
  PICK_BTN: "flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] py-3 pl-3.5 pr-2 text-left text-sm font-medium text-gray-900 dark:text-white shadow-sm outline-none transition hover:border-[#0066FF]/40 disabled:cursor-not-allowed disabled:opacity-45",
  INPUT: "w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#FAFBFD] dark:bg-[#1A1E26] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition placeholder:text-gray-400 focus-visible:border-[#0066FF] focus-visible:ring-2 focus-visible:ring-[#0066FF]/15",
  PRIMARY_BTN: "inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-[#0066FF] py-3.5 text-sm font-bold text-white shadow-md shadow-[#0066FF]/20 transition-all hover:bg-[#0052CC] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none disabled:active:scale-100",
  GHOST_ICON: "rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white active:scale-95",
};

