/**
 * Custom Error ABIs for the Lottery contracts.
 * These will be intercepted and translated by the web3-core global error parser.
 */
export const LOTTERY_EXCHANGE_ABI = [
  {
    inputs: [],
    name: "TicketAlreadyClaimed",
    type: "error",
  },
  {
    inputs: [],
    name: "LotteryNotDrawnYet",
    type: "error",
  }
] as const;
