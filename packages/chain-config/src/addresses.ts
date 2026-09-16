import { mainnet, polygon, arbitrum, sepolia } from 'viem/chains';

/**
 * Global Core Addresses Mapping
 * Instead of relying on `.env` which is unsafe for dynamic chain switching,
 * we map essential contract addresses by their Chain ID.
 */
export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [sepolia.id]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
};

export const WETH_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  [polygon.id]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
};
