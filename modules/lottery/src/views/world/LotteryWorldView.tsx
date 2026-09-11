"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldLottoStore } from "./store/useWorldLottoStore";
import { LottoTabs } from "../../components/LottoTabs";
import { IssueStatusStrip } from "../../components/common/IssueStatusStrip";
import { NumberPickerCard, WORLD_7_SLOTS } from "../../components/common/NumberPickerCard";
import { CurrentBetSummaryCard } from "../../components/common/CurrentBetSummaryCard";
import { LottoBanner } from "./components/LottoBanner";
import { SevenCountryRulesCard } from "./components/SevenCountryRulesCard";
import { PreviousIssueCard } from "./components/PreviousIssueCard";
import { UtcTimelineCard } from "./components/UtcTimelineCard";
import { MyTicketsTabContent } from "./components/MyTicketsTabContent";
import { RulesTabContent } from "./components/RulesTabContent";

export function LotteryWorldView() {
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
  } = useWorldLottoStore();

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
              <IssueStatusStrip />

              {/* 2. Betting Zone: Mobile stacked, PC side-by-side equal height */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <NumberPickerCard
                  digitsCount={7}
                  slots={WORLD_7_SLOTS}
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

              {/* 3. Promotional Banner */}
              <LottoBanner />

              {/* 4. Bottom Info: PC 2-column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <SevenCountryRulesCard />
                <div className="flex flex-col gap-4 sm:gap-5 justify-between">
                  <PreviousIssueCard />
                  <UtcTimelineCard />
                </div>
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
              <MyTicketsTabContent />
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
              <RulesTabContent />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { LotteryWorldView as LotteryWorldPage };
