"use client";

import React from "react";

const COUNTRY_RULES = [
  {
    slot: "1 位",
    country: "美国 Powerball",
    flag: "🇺🇸",
    detail: "周六 · 白球第5位",
    range: "0-9",
  },
  {
    slot: "2 位",
    country: "中国 体彩大乐透",
    flag: "🇨🇳",
    detail: "周六 · 主号尾数",
    range: "0-9",
  },
  {
    slot: "3 位",
    country: "德国 Lotto 6aus49",
    flag: "🇩🇪",
    detail: "周六 · 主号尾数",
    range: "0-9",
  },
  {
    slot: "4 位",
    country: "日本 LOTO 7",
    flag: "🇯🇵",
    detail: "周五 · 主号第7位",
    range: "0-9",
  },
  {
    slot: "5 位",
    country: "英国 Thunderball",
    flag: "🇬🇧",
    detail: "周六 · 主号第5位",
    range: "0-9",
  },
  {
    slot: "6 位",
    country: "法国 LOTO",
    flag: "🇫🇷",
    detail: "周六 · 主号第5位",
    range: "0-9",
  },
  {
    slot: "7 位",
    country: "意大利 SuperEnalotto",
    flag: "🇮🇹",
    detail: "周六 · 主号第6位",
    range: "0-9",
  },
];

export function SevenCountryRulesCard() {
  return (
    <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 md:p-7 border border-[#eef3fa] shadow-sm flex flex-col justify-between h-full">
      <div>
        <h4 className="text-[17px] sm:text-[19px] font-bold text-[#0c0d10]">
          7 国开奖号生成
        </h4>
        <p className="text-[11px] sm:text-[12px] text-[#71717a] mt-1 leading-relaxed">
          按国家顺序提取主号码池最后一个正选数字的尾数，拼接为 7 位开奖号。
        </p>
      </div>

      <div className="flex flex-col my-auto py-2">
        {COUNTRY_RULES.map((rule, idx) => (
          <div
            key={rule.country}
            className={`flex items-center justify-between py-3 sm:py-3.5 px-2 hover:bg-gray-50/80 rounded-xl transition-colors ${
              idx !== COUNTRY_RULES.length - 1 ? "border-b border-[#f3f4f8]" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
              {/* Flag Badge */}
              <span className="text-[16px] sm:text-[18px] select-none shrink-0">
                {rule.flag}
              </span>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0c0d10] truncate">
                {rule.slot} · {rule.country}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#64748b] shrink-0">
                {rule.detail}
              </span>
            </div>

            <span className="font-mono font-bold text-[13px] sm:text-[14px] text-[#163300] pl-2">
              {rule.range}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#f3f4f8] text-[11px] text-[#71717a]">
        公证公开 · 开奖源数据上链存证并可溯源比对
      </div>
    </div>
  );
}
