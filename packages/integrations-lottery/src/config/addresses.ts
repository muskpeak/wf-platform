import { mainnet, polygon, sepolia } from 'viem/chains';

/**
 * Lottery Specific Contracts
 * Only imported and used within the integrations-lottery package
 */
export const LOTTERY_ADDRESSES: Record<number, { mainLottery: `0x${string}`; rewardPool: `0x${string}` }> = {
  [mainnet.id]: {
    mainLottery: '0x1234567890123456789012345678901234567890',
    rewardPool: '0x0987654321098765432109876543210987654321',
  },
  [polygon.id]: {
    mainLottery: '0x1111111111111111111111111111111111111111',
    rewardPool: '0x2222222222222222222222222222222222222222',
  },
  [sepolia.id]: {
    mainLottery: '0x3333333333333333333333333333333333333333',
    rewardPool: '0x4444444444444444444444444444444444444444',
  }
};
