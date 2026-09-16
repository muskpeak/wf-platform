"use client";

import React from "react";

const PRIZE_RULES = [
  {
    name: "一等奖",
    description: "中奖号码同开奖号码的三位数字及顺序完全匹配",
    percent: "50%",
  },
  {
    name: "二等奖",
    description: "中奖号码与开奖号码的三位数字相同但顺序不限（不包括豹子号）",
    percent: "20%",
  },
  {
    name: "三等奖",
    description: "中奖号码同开奖号码的两位数字相同，滑动匹配",
    percent: "30%",
  },
];

export function Rules3DTabContent() {
  return (
    <section className="w-full bg-white rounded-[20px] p-6 flex flex-col gap-6">
      <h2 className="text-[20px] font-semibold text-[#0f172a] leading-normal">
        奖项规则
      </h2>

      <div className="flex flex-col gap-2">
        {PRIZE_RULES.map((rule) => (
          <div
            key={rule.name}
            className="bg-[#f3f4f8] rounded-[14px] px-2 py-1.5 min-h-[44px] flex items-center justify-between gap-2"
          >
            <div className="flex flex-1 min-w-0 items-center gap-4">
              <div className="w-20 h-8 rounded-2xl bg-[#dfeaff] flex items-center justify-center shrink-0">
                <span className="text-[13px] leading-4 font-bold text-[#131416]">
                  {rule.name}
                </span>
              </div>
              <p className="w-40 text-[12px] leading-5 font-normal text-[#17210e]">
                {rule.description}
              </p>
            </div>

            <div className="w-14 h-7 rounded-2xl bg-[#08f] flex items-center justify-center shrink-0">
              <span className="text-[14px] leading-[18px] font-bold text-white">
                {rule.percent}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
