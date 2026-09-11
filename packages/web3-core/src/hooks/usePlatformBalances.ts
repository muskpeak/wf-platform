"use client";

import { useBalance } from "wagmi";
import { Address } from "viem";
import { polygon } from "viem/chains";

export interface PlatformBalanceTokens {
  usdc?: Address;
  mUsdc?: Address;
}

export function usePlatformBalances(
  address: string | null,
  tokens?: PlatformBalanceTokens
) {
  const aaAddress = address as Address | undefined;

  // 查询真 U (原生 USDC，通过参数或配置注入，严禁硬编码)
  const {
    data: realUsdcBalance,
    isLoading: isLoadingRealUsdc,
    refetch: refetchRealUsdc,
  } = useBalance({
    address: aaAddress,
    token: tokens?.usdc,
    chainId: polygon.id,
    query: {
      enabled: !!aaAddress && !!tokens?.usdc,
      refetchInterval: 30000,
    },
  });

  // 查询测试 U (mUSDC，通过参数或配置注入，严禁硬编码)
  const {
    data: mUsdcBalance,
    isLoading: isLoadingMUsdc,
    refetch: refetchMUsdc,
  } = useBalance({
    address: aaAddress,
    token: tokens?.mUsdc,
    chainId: polygon.id,
    query: {
      enabled: !!aaAddress && !!tokens?.mUsdc,
      refetchInterval: 30000,
    },
  });

  return {
    realUsdc: {
      data: realUsdcBalance,
      isLoading: isLoadingRealUsdc,
      formatted: realUsdcBalance ? Number(realUsdcBalance.formatted).toFixed(2) : "0.00",
    },
    mUsdc: {
      data: mUsdcBalance,
      isLoading: isLoadingMUsdc,
      formatted: mUsdcBalance ? Number(mUsdcBalance.formatted).toFixed(2) : "0.00",
    },
    refetchAll: () => {
      refetchRealUsdc();
      refetchMUsdc();
    },
  };
}
