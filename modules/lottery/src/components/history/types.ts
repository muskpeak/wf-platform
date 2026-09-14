export type HistoryTabId = "orders" | "rewards" | "claims";

export interface BetOrderRecord {
  id: string;
  issue: string; // Round ID
  ticketId: string;
  numbers: string; // e.g. "7753920" or "775"
  multiplier: number;
  amount: string; // e.g. "100USDT"
  time: string; // e.g. "04/13 09:43"
  status: "待开奖" | "已中奖" | "未中奖" | "已取消" | string;
  isWin?: boolean;
  prize: string;
  netPnL: string;
  isNetNegative: boolean;
  canClaim: boolean;
  canRefund?: boolean;
  isRefunded?: boolean;
  isClaimed?: boolean;
  winningNumber?: string;
}

export interface DrawRewardRecord {
  id: string;
  issue: string;
  winningNumbers: string; // e.g. "3441208" or "344"
  tier: string; // e.g. "一等奖"
  amount: string; // e.g. "105.00 USDT"
  status: "待确认" | "已派发" | string;
}

export interface ClaimRecord {
  id: string;
  issue: string;
  balls: (number | string)[]; // length 7 for World, length 3 for 3D
  tier: string; // e.g. "二等奖", "三等奖"
  amount: string; // e.g. "100 USDT", "4500 USDT"
  isClaimed: boolean;
}

export interface HistoryStats {
  currentBetAmount?: string;
  currentIssue?: string;
  currentBetDetail?: string;
  pendingOrdersCount?: string | number;
  pendingOrdersNote?: string;
  completedOrdersCount?: string | number;
  completedOrdersNote?: string;
  errorOrdersCount?: string | number;
  errorOrdersNote?: string;
}

export interface LotteryHistoryProps {
  /**
   * Number of balls in this game (7 for World Lotto, 3 for 3D Lotto)
   * @default 7
   */
  ballCount?: number;
  /**
   * Game identifier
   * @default "world"
   */
  gameType?: "world" | "3d";
  /**
   * Currency label
   * @default "USDT"
   */
  currency?: string;
  /**
   * Current issue string
   * @default "2450"
   */
  currentIssue?: string;
  stats?: HistoryStats;
  orders?: BetOrderRecord[];
  rewards?: DrawRewardRecord[];
  claims?: ClaimRecord[];
  onClaim?: (recordId: string) => void;
  onRefund?: (recordId: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  className?: string;
}
