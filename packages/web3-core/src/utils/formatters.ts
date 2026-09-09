import { formatUnits, parseUnits } from 'viem';

/**
 * Truncates a Web3 address to a shorter format.
 * Example: 0x1234567890abcdef1234567890abcdef12345678 -> 0x1234...5678
 * 
 * @param address The full address string
 * @param startChars Number of characters to keep at the start (after 0x)
 * @param endChars Number of characters to keep at the end
 * @returns The truncated address
 */
export function truncateAddress(address: string, startChars = 4, endChars = 4): string {
  if (!address || address.length < startChars + endChars + 2) {
    return address;
  }
  return `${address.substring(0, startChars + 2)}...${address.substring(address.length - endChars)}`;
}

/**
 * Formats a blockchain bigint amount into a human-readable string with limited decimals.
 * Handles precision safely without floating point math errors.
 * 
 * @param amount The raw bigint amount from the smart contract
 * @param tokenDecimals The decimals of the token (e.g., 18 for ETH, 6 for USDC)
 * @param displayDecimals The maximum number of decimals to display in the UI
 * @returns Formatted string (e.g., "1.2345")
 */
export function formatTokenAmount(amount: bigint | string | number, tokenDecimals = 18, displayDecimals = 4): string {
  if (amount === undefined || amount === null) return '0';
  
  // Convert to string for viem
  const amountStr = amount.toString();
  
  // Use viem's robust formatUnits
  const formatted = formatUnits(BigInt(amountStr), tokenDecimals);
  
  // Split into whole and decimal parts
  const [whole, decimal] = formatted.split('.');
  
  if (!decimal) return whole;
  
  // Truncate decimal part to displayDecimals
  const truncatedDecimal = decimal.substring(0, displayDecimals);
  
  // Strip trailing zeros
  const cleanDecimal = truncatedDecimal.replace(/0+$/, '');
  
  return cleanDecimal.length > 0 ? `${whole}.${cleanDecimal}` : whole;
}

/**
 * Parses a human-readable token amount string into a blockchain bigint.
 * 
 * @param amount The human readable string (e.g., "1.5")
 * @param tokenDecimals The decimals of the token (e.g., 18 for ETH, 6 for USDC)
 * @returns The bigint value ready for smart contract interaction
 */
export function parseTokenAmount(amount: string, tokenDecimals = 18): bigint {
  if (!amount) return BigInt(0);
  return parseUnits(amount, tokenDecimals);
}
