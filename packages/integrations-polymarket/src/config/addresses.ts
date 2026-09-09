import { polygon } from 'viem/chains';

/**
 * Polymarket Specific Contracts
 * These are ONLY relevant to the Polymarket integration package.
 */
export const POLYMARKET_ADDRESSES: Record<number, { ctfExchange: `0x${string}`; conditionalTokens: `0x${string}` }> = {
  [polygon.id]: {
    ctfExchange: '0x4bFb16c56254005b4A45B73B250D89b3504e7AE2', // Exchange V2
    conditionalTokens: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
  }
};
