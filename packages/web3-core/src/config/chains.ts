import { mainnet, polygon, sepolia, arbitrum } from 'viem/chains';

export const SUPPORTED_CHAINS = [mainnet, polygon, arbitrum, sepolia] as const;
