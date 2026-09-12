import { BaseError, ContractFunctionRevertedError, decodeErrorResult } from 'viem';

export type Web3ErrorKind = 
  | 'user_rejected' 
  | 'insufficient_funds' 
  | 'insufficient_gas' 
  | 'network_error' 
  | 'contract_reverted' 
  | 'unknown';

export interface ParsedWeb3Error {
  kind: Web3ErrorKind;
  /**
   * The parsed English message or the custom error name (e.g., 'InsufficientLiquidity').
   * This should be passed to the UI for i18n translation.
   */
  message: string;
  /** 
   * Raw error dump, useful for telemetry but should NOT be shown to users directly.
   */
  raw: string;
}

const REJECTION_PATTERNS = [
  'user rejected',
  'user denied',
  'user cancel',
  'rejected the request',
  'denied transaction signature',
  'rejected by user',
];

// --- 全局 ABI 字典 ---
// 由各业务包在主站启动时注册进来
// 供拦截器深度解码自定义错误
const GLOBAL_ABIS: any[] = [];

export function registerGlobalABIs(abis: any[]) {
  GLOBAL_ABIS.push(...abis);
}

/**
 * Parses raw viem/web3 errors into clean, structured objects suitable for UI and telemetry.
 * Combines generic wallet error detection with deep Account Abstraction (AA) hex decoding.
 * Directly extracts and returns the native contract errorName (e.g. 'RoundNotOpen', 'MaxTicketsReached').
 * 
 * @param error The caught exception
 * @param abis Optional array of ABIs to use for deep decoding AA hex dumps.
 */
export function parseWeb3Error(error: any, abis: any[] = []): ParsedWeb3Error {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const lowerRaw = rawMessage.toLowerCase();

  // 1. Detect User Rejections (EIP-1193: 4001 or string matches)
  if (
    (error as any).code === 4001 || 
    REJECTION_PATTERNS.some(p => lowerRaw.includes(p))
  ) {
    return { kind: 'user_rejected', message: 'UserRejected', raw: rawMessage };
  }

  // 2. Detect Generic Gas / Funds issues
  if (lowerRaw.includes('insufficientbalance') || lowerRaw.includes('insufficient balance')) {
    return { kind: 'insufficient_funds', message: 'InsufficientBalance', raw: rawMessage };
  }
  if (lowerRaw.includes('insufficient funds') || lowerRaw.includes('insufficientgas') || lowerRaw.includes('intrinsic gas too low')) {
    return { kind: 'insufficient_gas', message: 'InsufficientGas', raw: rawMessage };
  }

  // 3. Deep Contract Revert Parsing (Standard viem walk)
  if (error instanceof BaseError) {
    const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const data = revertError.data;
      const errorName = data?.errorName || 'Unknown';
      if (errorName && errorName !== 'Unknown' && errorName !== 'Error') {
        return {
          kind: 'contract_reverted',
          message: errorName, // 直接返回自定义错误名，如 'RoundNotOpen', 'MaxTicketsReached'
          raw: rawMessage
        };
      }
    }
  }

  // 4. AA (Account Abstraction) Hex Dump Parsing
  // Bundlers often swallow custom errors and return raw hex strings in the message.
  const combinedAbis = [...abis, ...GLOBAL_ABIS];
  const hexMatches = rawMessage.match(/0x[a-fA-F0-9]{8,}/g);

  if (hexMatches && hexMatches.length > 0 && combinedAbis.length > 0) {
    for (const hex of hexMatches) {
      for (const abi of combinedAbis) {
        try {
          const decoded = decodeErrorResult({
            abi,
            data: hex as `0x${string}`,
          });
          if (decoded && decoded.errorName && decoded.errorName !== 'Error') {
            return {
              kind: 'contract_reverted',
              message: decoded.errorName, // 直接抛出原始自定义错误名 (如 RoundNotOpen, MaxTicketsReached)
              raw: rawMessage,
            };
          }
        } catch {
          // Ignore decode failure, try next hex or next ABI
        }
      }
    }
  }

  // 5. Fallback: extract specific revert reason or hex selector
  const simulationRevertMatch = rawMessage.match(/reverted during simulation with reason:\s*([^\n\r.]+)/i);
  if (simulationRevertMatch && simulationRevertMatch[1]) {
    return {
      kind: 'contract_reverted',
      message: simulationRevertMatch[1].trim(),
      raw: rawMessage,
    };
  }

  return {
    kind: 'unknown',
    message: 'ContractReverted',
    raw: rawMessage,
  };
}
