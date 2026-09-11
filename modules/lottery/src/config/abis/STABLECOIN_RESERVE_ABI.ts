export const STABLECOIN_RESERVE_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "authorizedAmount", type: "uint256" },
      { name: "minWusdOut", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "deposit",
    outputs: [
      { name: "received", type: "uint256" },
      { name: "wusdCredited", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "wusdAmount", type: "uint256" },
      { name: "minTokenOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "tokenAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

