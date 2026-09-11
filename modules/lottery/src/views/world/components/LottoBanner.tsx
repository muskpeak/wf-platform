"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useWorldLottoStore } from "../store/useWorldLottoStore";

export function LottoBanner() {
  const { setActiveTab } = useWorldLottoStore();

  return (
    <div className="relative rounded-[22px] overflow-hidden border border-[#008cff] p-4 sm:p-5 text-white bg-gradient-to-r from-[#020805] via-[#06120b] to-[#0d2215] shadow-sm">
      {/* Subtle gold bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-r from-[rgba(247,197,107,0.16)] via-[rgba(223,175,76,0.08)] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#fff7d8] text-[#2b1a02] px-2.5 py-0.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            <span className="text-[11px] font-bold">7 国数据源</span>
          </div>

          <h4 className="text-[16px] font-bold text-white mt-0.5">
            世界乐透 · 七国彩票开奖
          </h4>

          <p className="text-[11px] text-[#fff1bf]">
            开奖号采用七个国家彩票数据
          </p>
          <p className="text-[10px] text-[#ddefe3]">
            公正公开 · 确认后不可更改
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className="self-start sm:self-auto inline-flex items-center gap-1 bg-[#fff7d8] hover:bg-[#ffefb8] text-[#2b1a02] text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer shadow-xs"
        >
          <span>查看详细规则</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
