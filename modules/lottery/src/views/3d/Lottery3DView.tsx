"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { use3DLottoStore } from "./store/use3DLottoStore";
import { LottoTabs } from "../../components/LottoTabs";
import { IssueStatusStrip } from "../../components/common/IssueStatusStrip";
import { NumberPickerCard, LOTTO_3D_SLOTS } from "../../components/common/NumberPickerCard";
import { CurrentBetSummaryCard } from "../../components/common/CurrentBetSummaryCard";
import { LottoBanner } from "../world/components/LottoBanner";
import { SevenCountryRulesCard } from "../world/components/SevenCountryRulesCard";
import { PreviousIssueCard } from "../world/components/PreviousIssueCard";
import { UtcTimelineCard } from "../world/components/UtcTimelineCard";

export function Lottery3DView() {
  const {
    activeTab,
    setActiveTab,
    selectedDigits,
    focusedIndex,
    currentMultiplier,
    setFocusedIndex,
    setDigit,
    clearDigits,
    setCurrentMultiplier,
    addCurrentBet,
    addRandomBets,
    bets,
    removeBet,
    clearBets,
    updateBetMultiplier,
  } = use3DLottoStore();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f3f4f8] pb-20">
      {/* Top Tabs */}
      <LottoTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 w-full max-w-[430px] lg:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "current" && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 sm:gap-5"
            >
              {/* 1. Issue Status Strip */}
              <IssueStatusStrip
                ticketNote="3位数号码"
              />

              {/* 2. Betting Zone: 3 digits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <NumberPickerCard
                  digitsCount={3}
                  slots={LOTTO_3D_SLOTS}
                  titleLabel="选择 3 位号码"
                  selectedDigits={selectedDigits}
                  focusedIndex={focusedIndex}
                  currentMultiplier={currentMultiplier}
                  setFocusedIndex={setFocusedIndex}
                  setDigit={setDigit}
                  clearDigits={clearDigits}
                  setCurrentMultiplier={setCurrentMultiplier}
                  addCurrentBet={addCurrentBet}
                  addRandomBets={addRandomBets}
                />
                <CurrentBetSummaryCard
                  bets={bets}
                  removeBet={removeBet}
                  clearBets={clearBets}
                  updateBetMultiplier={updateBetMultiplier}
                />
              </div>

            </motion.div>
          )}

          {activeTab === "mytickets" && (
            <motion.div
              key="mytickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 w-full"
            >
              <div className="flex items-center justify-center min-h-[200px] text-[#9aa6b2] text-[14px]">
                历史投注记录（待接入）
              </div>
            </motion.div>
          )}

          {activeTab === "rules" && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-center min-h-[200px] text-[#9aa6b2] text-[14px]">
                奖金规则（待接入）
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { Lottery3DView as Lottery3DPage };
