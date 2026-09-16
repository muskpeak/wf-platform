import type { RecordItem } from "./types";

// 静态 UI 展示用示例数据（结构与 Figma 1994:53354 完全对应）
export const MOCK_RECORDS: RecordItem[] = [
  {
    id: "r-1",
    type: "充值",
    status: "处理中",
    refNo: "WF-FN-0907-002",
    timestamp: "2026-09-07 09:58:00",
    ledgers: [
      { account: "资金账户", note: "余额未变化", kind: "unchanged" },
    ],
  },
  {
    id: "r-2",
    type: "充值",
    status: "成功",
    refNo: "WF-FN-0907-002",
    timestamp: "2026-09-07 09:58:00",
    ledgers: [
      { account: "资金账户", amount: "+44.82 U", kind: "in" },
    ],
  },
  {
    id: "r-3",
    type: "提现",
    status: "成功",
    refNo: "WF-FN-0907-002",
    timestamp: "2026-09-07 09:58:00",
    ledgers: [
      { account: "资金账户", amount: "-44.82 U", kind: "out" },
    ],
  },
  {
    id: "r-4",
    type: "划转",
    status: "成功",
    refNo: "WF-FN-0907-002",
    timestamp: "2026-09-07 09:58:00",
    ledgers: [
      { account: "资金账户", amount: "-44.82 U", kind: "out" },
      { account: "彩票账户", amount: "+44.82 U", kind: "in" },
    ],
  },
  {
    id: "r-5",
    type: "参与投注",
    status: "成功",
    refNo: "WF-FN-0907-002",
    timestamp: "2026-09-07 09:58:00",
    ledgers: [
      { account: "彩票账户", amount: "-44.82 U", kind: "out" },
    ],
  },
];
