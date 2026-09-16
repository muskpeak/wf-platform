// 直接从 dat-dapp/Vault.types.ts 搬运，保持完整类型定义

export type QuoteStep = {
  kind?: string;
  id?: string;
  depositAddress?: string;
  requestId?: string | null;
  action?: string;
  description?: string;
  items?: Array<{
    data?: {
      from?: string;
      to?: string;
      data?: string;
      value?: string;
      chainId?: number;
    };
    check?: { endpoint?: string };
  }>;
};

export type VaultFee = {
  amount?: string | number;
  amountUsd?: string | number;
  amountFormatted?: string;
  currency?: { symbol?: string; name?: string };
};

export type QuoteData = {
  steps?: QuoteStep[];
  fees?: Record<string, VaultFee> | VaultFee[];
  details?: {
    totalImpact?: { percent?: number };
    slippageTolerance?: { destination?: { percent?: number } };
    timeEstimate?: number;
    currencyIn?: {
      amountFormatted?: string;
      amount?: string;
      currency?: {
        symbol?: string;
        name?: string;
        chainId?: number;
        address?: string;
        decimals?: number;
        metadata?: { logoURI?: string };
      };
    };
    currencyOut?: {
      amountFormatted?: string;
      currency?: {
        symbol?: string;
        name?: string;
        chainId?: number;
        address?: string;
        decimals?: number;
        metadata?: { logoURI?: string };
      };
    };
    rate?: string | number;
    fee?: { formatted?: string; currency?: { symbol?: string } };
  };
};

export type VaultToken = {
  address?: string;
  symbol?: string;
  decimals?: number;
  metadata?: { logoURI?: string };
  logoURI?: string | null;
  minAmount?: string;
  refundTo?: string;
  recommended?: boolean;
};

export type VaultChain = {
  id: number;
  name?: string;
  displayName?: string;
  vmType?: string;
  disabled?: boolean;
  iconUrl?: string | null;
  depositEnabled?: boolean;
  currency?: VaultToken;
  featuredTokens?: VaultToken[];
  solverCurrencies?: VaultToken[];
};
