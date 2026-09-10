import { erc20Abi } from 'viem';

/**
 * Standard ERC20 ABI
 * We re-export viem's built-in ERC20 ABI for convenience across the platform.
 * Using 'as const' ensures strict typing for contract reads/writes.
 */
export const ERC20_ABI = erc20Abi;

/**
 * Custom Error Examples for ERC20 Extensions
 * For the deep error parser to catch these, we define them here.
 */
export const ERC20_CUSTOM_ERRORS_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "available", type: "uint256" }],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "AccountBlacklisted",
    type: "error",
  }
] as const;
