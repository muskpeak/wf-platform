"use client";

import React, { useState } from "react";

type RuleCategory = "flow" | "numbers" | "backup" | "conditions" | "rewards";

const CATEGORIES: { id: RuleCategory; label: string }[] = [
  { id: "flow", label: "玩法流程" },
  { id: "numbers", label: "号码说明" },
  { id: "backup", label: "替补规则" },
  { id: "conditions", label: "中奖条件" },
  { id: "rewards", label: "奖项说明" },
];

const SOURCES = [
  { slot: "1 位 · 美国", name: "Powerball", day: "周六", flag: "🇺🇸" },
  { slot: "2 位 · 中国", name: "体彩大乐透", day: "周六", flag: "🇨🇳" },
  { slot: "3 位 · 德国", name: "Lotto 6aus49", day: "周六", flag: "🇩🇪" },
  { slot: "4 位 · 日本", name: "LOTO 7", day: "周五", flag: "🇯🇵" },
  { slot: "5 位 · 英国", name: "Thunderball", day: "周六", flag: "🇬🇧" },
  { slot: "6 位 · 法国", name: "LOTO", day: "周六", flag: "🇫🇷" },
  { slot: "7 位 · 意大利", name: "SuperEnalotto", day: "周六", flag: "🇮🇹" },
];

export function RulesTabContent() {
  const [activeCategory, setActiveCategory] = useState<RuleCategory>("flow");

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Page Title */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[28px] font-bold text-[#0c0d10] leading-tight">奖金规则</h2>
        <p className="text-[12px] text-[#71717a]">来源、周期、奖项和异常处理集中查看</p>
      </div>

      {/* Categories Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`h-[33px] px-3.5 rounded-[16.5px] text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-[#101114] text-white font-bold"
                  : "bg-[#e4eaf6] text-[#163300] hover:bg-[#d8e1f0]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 开奖号码数据来源 Card */}
      <div className="bg-white border border-[#dce2ec] rounded-[22px] p-4 flex flex-col gap-3 shadow-2xs">
        <div>
          <h3 className="text-[18px] font-bold text-[#0c0d10]">开奖号码数据来源</h3>
          <p className="text-[12px] text-[#71717a] mt-0.5">
            7 位开奖号码分别来自全球 7 个主力国家官方彩票结果。
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {SOURCES.map((s) => (
            <div
              key={s.slot}
              className="bg-[#f8f9fc] rounded-[12px] px-3 py-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[16px] bg-white border border-gray-100 shadow-2xs">
                  {s.flag}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#0c0d10]">{s.slot}</span>
                  <span className="text-[10px] text-[#475767]">{s.name}</span>
                </div>
              </div>

              <span className="text-[11px] font-medium text-[#008ff0]">{s.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 号码提取规则 Card */}
      <div className="bg-[#edf0f8] border border-[#dfe5f2] rounded-[22px] p-4 flex flex-col gap-2.5">
        <h3 className="text-[18px] font-bold text-[#0c0d10]">号码提取规则</h3>
        <p className="text-[12px] text-[#475767] leading-relaxed">
          每个国家取指定官方开奖号中的最后一个有效数字，按国家顺序拼成 7 位开奖号。
        </p>

        <div className="bg-white rounded-[16px] p-3 flex items-center justify-center gap-2 shadow-2xs">
          {["10", "15", "20", "45", "32", "19", "08"].map((demo, idx) => (
            <div
              key={idx}
              className="bg-[#f8f9fc] w-[38px] h-[30px] rounded-[15px] flex items-center justify-center font-mono font-bold text-[12px] text-[#163300]"
            >
              {demo}
            </div>
          ))}
        </div>
      </div>

      {/* 奖级与分配规则 Card */}
      <div className="bg-white border border-[#dce2ec] rounded-[22px] p-4 flex flex-col gap-3 shadow-2xs">
        <h3 className="text-[18px] font-bold text-[#0c0d10]">奖金与奖级分配</h3>
        <div className="flex flex-col gap-2 text-[12px]">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-bold text-[#163300]">一等奖 (全中 7 位)</span>
            <span className="font-mono text-[#008ff0] font-bold">奖池 70% + 累计</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-bold text-[#163300]">二等奖 (连续中 6 位)</span>
            <span className="font-mono text-[#475767] font-semibold">奖池 15%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-bold text-[#163300]">三等奖 (连续中 5 位)</span>
            <span className="font-mono text-[#475767] font-semibold">奖池 10%</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-bold text-[#163300]">固定安慰奖 (中 1~4 位)</span>
            <span className="font-mono text-[#475767] font-semibold">固定 5 USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
