'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import type { LedgerEntry, RecordItem } from '../types'

// 状态 tag 样式
const STATUS_TAG_STYLE: Record<
  RecordItem['status'],
  { bg: string; color: string; border?: string }
> = {
  // 处理中：中性灰底
  处理中: { bg: '#E7EBF4', color: '#303030' },
  // 成功：淡绿底
  成功: { bg: 'rgba(34, 197, 94, 0.2)', color: '#00A63E' },
}

// Ledger 金额颜色
const amountStyle = (kind?: LedgerEntry['kind']) => {
  if (kind === 'in') return { color: '#137653', fontWeight: 740 }
  if (kind === 'out') return { color: '#C44842', fontWeight: 740 }
  // unchanged
  return {
    color: '#141B2B',
    fontWeight: 400,
    fontFamily: 'PingFang SC, Noto Sans SC, sans-serif',
    fontSize: 12,
  }
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '8px 12px',
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid #D5DBE7',
        borderRadius: 10,
        backgroundColor: 'transparent',
      }}
    >
      <span
        style={{
          fontFamily: 'Noto Sans SC, sans-serif',
          fontWeight: 700,
          fontSize: 12,
          lineHeight: '12px',
          color: '#0C0D10',
          flexShrink: 0,
        }}
      >
        {entry.account}
      </span>

      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          lineHeight: '14px',
          ...amountStyle(entry.kind),
          flexShrink: 0,
        }}
      >
        {entry.kind === 'unchanged' ? entry.note : entry.amount}
      </span>
    </div>
  )
}

export function RecordCard({ record }: { record: RecordItem }) {
  const statusStyle = STATUS_TAG_STYLE[record.status]

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 首行：类型 + 状态 tag */}
      <div className="flex items-center justify-between" style={{ width: '100%' }}>
        <span
          style={{
            fontFamily: 'Noto Sans SC, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            lineHeight: '14px',
            color: '#163300',
          }}
        >
          {record.type}
        </span>

        <div
          className="flex items-center justify-center"
          style={{
            padding: '4px 10px',
            width: 60,
            height: 24,
            borderRadius: 9999,
            backgroundColor: statusStyle.bg,
          }}
        >
          <span
            style={{
              fontFamily: 'PingFang SC, Noto Sans SC, sans-serif',
              fontWeight: 400,
              fontSize: 10,
              lineHeight: '10px',
              color: statusStyle.color,
              textAlign: 'center',
            }}
          >
            {record.status}
          </span>
        </div>
      </div>

      {/* 记录号 + 时间 */}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: 10,
          lineHeight: '10px',
          color: '#6D7890',
        }}
      >
        {record.refNo} · {record.timestamp}
      </span>

      {/* Ledger 列表（可能一条或多条） */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        {record.ledgers.map((entry, idx) => (
          <LedgerRow key={idx} entry={entry} />
        ))}
      </div>

      {/* 详情入口 */}
      <div
        className="flex items-center justify-end"
        style={{ cursor: 'pointer', padding: '0 16px' }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <span
            style={{
              fontFamily: 'Noto Sans SC, sans-serif',
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '14px',
              color: '#303030',
            }}
          >
            详情
          </span>
          <ChevronDown size={12} color="#303030" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  )
}
