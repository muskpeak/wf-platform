import { useQuery } from '@tanstack/react-query';
import { Address, PublicClient } from 'viem';
// 假设上层 provider 会通过 Context 下发 publicClient，或者直接从你的 Web3Provider 获取
// 这里我们为了演示，要求传入 publicClient，或者在实际项目中你可以用 Zustand 存储全局 publicClient
// import { usePublicClient } from 'wagmi';

export type MulticallContract = {
  address: Address;
  abi: any;
  functionName: string;
  args?: any[];
};

export function useMulticall<T>(publicClient: PublicClient | undefined, contracts: MulticallContract[], queryKey: string[]) {
  return useQuery({
    queryKey: ['multicall', ...queryKey],
    queryFn: async () => {
      if (!publicClient || !contracts || contracts.length === 0) return null;
      
      const results = await publicClient.multicall({
        contracts,
      });
      
      return results.map((res: any) => (res.status === 'success' ? res.result : null)) as T;
    },
    staleTime: 30 * 1000, 
    enabled: Boolean(publicClient && contracts && contracts.length > 0),
  });
}
