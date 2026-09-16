'use client'

import React from 'react'
import { motion } from 'framer-motion'

export type LottoTabType = 'current' | 'mytickets' | 'rules'

interface LottoTabsProps {
  activeTab?: LottoTabType
  onTabChange?: (tab: LottoTabType) => void
}

const TABS: { id: LottoTabType; label: string }[] = [
  { id: 'current', label: '本期投注' },
  { id: 'mytickets', label: '历史投注' },
  { id: 'rules', label: '奖金规则' },
]

export function LottoTabs({ activeTab = 'current', onTabChange }: LottoTabsProps) {
  return (
    <div className="bg-white border-b border-[#e5e7eb] w-full sticky top-16 z-30 shadow-2xs select-none">
      <div className="flex items-center justify-between lg:justify-start lg:gap-12 px-6 sm:px-8 lg:px-6 max-w-[430px] lg:max-w-6xl mx-auto h-[48px] md:h-[60px] lg:h-[68px]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`relative h-full flex items-center justify-center px-1 sm:px-3 cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#17210e] font-bold'
                  : 'text-[#6b7280] hover:text-[#17210e] font-medium'
              }`}
            >
              <span className="text-[14px] md:text-[18px] lg:text-[22px] tracking-wide whitespace-nowrap">
                {tab.label}
              </span>

              {/* Active Bottom Indicator with smooth Framer Motion spring */}
              {isActive && (
                <motion.div
                  layoutId="lotto-active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] lg:h-[3px] bg-[#17210e]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
