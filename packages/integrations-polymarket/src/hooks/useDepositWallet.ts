import { useState, useCallback } from 'react';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { getContractConfig } from '@polymarket/builder-relayer-client/dist/config';
import { POLYMARKET_CONFIG } from '../config';

export function useDepositWallet() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getDepositWalletAddress = useCallback(async (signer: any) => {
    try {
      const chainId = await signer.getChainId();
      const config = getContractConfig(chainId);
      if (!config) {
        throw new Error(`No contract config for chain ${chainId}`);
      }

      const relayerUrl = chainId === 137 ? '/api/relayer' : 'https://relayer-amoy.polymarket.com';
      const client = new RelayClient(relayerUrl, chainId, signer as any);
      return await client.deriveDepositWalletAddress();
    } catch (err) {
      console.error('Failed to get deposit wallet address', err);
      throw err;
    }
  }, []);

  const deployDepositWallet = useCallback(async (signer: any) => {
    try {
      setIsDeploying(true);
      setError(null);
      const chainId = await signer.getChainId();
      const config = getContractConfig(chainId);
      if (!config) {
        throw new Error(`No contract config for chain ${chainId}`);
      }

      const relayerUrl = chainId === 137 ? '/api/relayer' : 'https://relayer-amoy.polymarket.com';
      const client = new RelayClient(relayerUrl, chainId, signer as any);
      
      const expectedAddress = await client.deriveDepositWalletAddress();
      const isDeployed = await client.getDeployed(expectedAddress, 'wallet');
      
      if (isDeployed) {
        return { depositWalletAddress: expectedAddress, alreadyDeployed: true };
      }

      const tx = await client.deployDepositWallet();
      console.log('Deploy tx:', tx);
      
      return { depositWalletAddress: expectedAddress, alreadyDeployed: false };
    } catch (err: any) {
      console.error('Failed to deploy deposit wallet:', err);
      setError(err);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  const approveDepositWallet = useCallback(async (signer: any, depositWalletAddress: string) => {
    try {
      setIsDeploying(true);
      setError(null);
      const chainId = await signer.getChainId();
      const config = getContractConfig(chainId);
      if (!config) {
        throw new Error(`No contract config for chain ${chainId}`);
      }

      const relayerUrl = chainId === 137 ? '/api/relayer' : 'https://relayer-amoy.polymarket.com';
      const client = new RelayClient(relayerUrl, chainId, signer as any);
      
      // approve(CTF_EXCHANGE_ADDRESS, maxUint256)
      const data = `0x095ea7b3000000000000000000000000${POLYMARKET_CONFIG.CTF_EXCHANGE_ADDRESS.slice(2).toLowerCase()}ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;
      const calls = [
        {
          target: POLYMARKET_CONFIG.USDC_ADDRESS,
          value: "0",
          data
        }
      ];

      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const tx = await client.executeDepositWalletBatch(calls, depositWalletAddress, deadline.toString());
      console.log('Approve tx:', tx);
      return tx;
    } catch (err: any) {
      console.error('Failed to approve deposit wallet:', err);
      setError(err);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  return {
    getDepositWalletAddress,
    deployDepositWallet,
    approveDepositWallet,
    isDeploying,
    error,
  };
}
