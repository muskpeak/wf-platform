import { Address, PublicClient } from 'viem';
import { useMulticall } from './useMulticall';
import { ERC20_ABI } from '@wf-platform/chain-config';

/**
 * 业务层封装：批量查询代币余额
 */
export function useTokenBalances(publicClient: PublicClient | undefined, walletAddress: Address | undefined, tokenAddresses: Address[]) {
  const contracts = tokenAddresses.map(tokenAddress => ({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
  }));

  const { data: balances, isLoading, refetch } = useMulticall<bigint[]>(
    publicClient,
    walletAddress && tokenAddresses.length > 0 ? contracts : [], 
    ['balances', walletAddress ?? 'none', ...tokenAddresses]
  );

  return {
    balances: balances || [],
    isLoading,
    refetch,
  };
}
