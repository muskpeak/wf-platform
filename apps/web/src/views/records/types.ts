export type RecordType = "充值" | "提现" | "划转" | "参与投注";
export type RecordStatus = "成功" | "处理中";
export type RecordAmountKind = "in" | "out" | "unchanged";

export interface LedgerEntry {
  account: string; // "资金账户" / "彩票账户"
  amount?: string; // "+44.82 U" / "-44.82 U"
  kind?: RecordAmountKind;
  note?: string; // e.g. "余额未变化"
}

export interface RecordItem {
  id: string;
  type: RecordType;
  status: RecordStatus;
  refNo: string; // "WF-FN-0907-002"
  timestamp: string; // "2026-09-07 09:58:00"
  ledgers: LedgerEntry[];
}
