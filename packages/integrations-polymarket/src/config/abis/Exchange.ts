/**
 * Polymarket CTF Exchange Custom Errors
 * We define them here to allow the global error interceptor to translate them.
 */
export const POLYMARKET_EXCHANGE_ABI = [
  {
    inputs: [],
    name: "OrderAlreadyFilledOrCancelled",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  }
] as const;
