"use client";

import React from "react";

const STAGES = [
  {
    code: "T1",
    name: "投注期",
    time: "周日 16:00 - 周五 07:59",
    hours: "112h",
    active: true,
  },
  {
    code: "T2",
    name: "封盘采集",
    time: "周五 08:00 - 周日 05:59",
    hours: "46h",
    active: false,
  },
  {
    code: "T3",
    name: "组合结算",
    time: "周日 06:00 - 15:59",
    hours: "10h",
    active: false,
  },
];

export function UtcTimelineCard() {
  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#eef3fa] shadow-sm flex flex-col gap-4">
      <h4 className="text-[16px] font-bold text-[#17210e]">UTC 单期生命周期</h4>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {STAGES.map((stage) => (
          <div
            key={stage.code}
            className={`rounded-[18px] p-3 flex flex-col justify-between h-[138px] relative overflow-hidden transition-all ${
              stage.active ? "bg-[#dae1e9]" : "bg-[#f3f4f8]"
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Badge */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  stage.active
                    ? "bg-[#008cff] text-white"
                    : "bg-[#dfeaff] text-[#163300]"
                }`}
              >
                {stage.code}
              </div>

              {/* Hours */}
              <span className="text-[13px] font-bold font-mono text-[#163300]">
                {stage.hours}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#17210e]">
                {stage.name}
              </span>
              <span className="text-[10px] text-[#6e756d] leading-tight">
                {stage.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#6e756d] mt-1">
        数据判定截止：周日 05:30:00 UTC，预留 30 分钟上链提议。
      </p>
    </div>
  );
}
